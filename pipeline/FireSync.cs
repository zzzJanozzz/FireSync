// FireSync data pipeline: harmonizes NASA FIRMS MODIS and VIIRS active-fire hotspots.
// Developed with SI (Claude, Anthropic) assistance.
// License: Apache-2.0.
//
// Build (Windows, no install needed):
//   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /optimize+ /out:pipeline\bin\firesync.exe
//       /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll pipeline\FireSync.cs
// Usage:
//   firesync.exe aggregate <zipDir> <workDir> [parallelism]
//   firesync.exe build <workDir> <webDataDir> [tileRes=0.25]
//
// Written for C# 5 (the compiler that ships with .NET Framework 4.x).

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FireSync
{
    // Satellite slots used everywhere in the pipeline.
    static class Sat
    {
        public const int Terra = 0, Aqua = 1, Snpp = 2, Noaa20 = 3, Noaa21 = 4, Count = 5;
        public static readonly string[] Names = { "Terra", "Aqua", "Suomi NPP", "NOAA-20", "NOAA-21" };
        public static readonly string[] Keys = { "T", "A", "S", "N", "J" };
    }

    // Month index t: 0 = 2000-11 (first MODIS Terra month in FIRMS).
    static class Months
    {
        public static int Index(int y, int m) { return (y - 2000) * 12 + (m - 1) - 10; }
        public static int Year(int t) { return 2000 + (t + 10) / 12; }
        public static int Month(int t) { return (t + 10) % 12 + 1; }
        public static int CalMonth(int t) { return (t + 10) % 12; } // 0 = January
        public static string Label(int t) { return Year(t).ToString("0000") + "-" + Month(t).ToString("00"); }
    }

    // The reference-satellite chain: which satellite defines each month of the harmonized record.
    static class Eras
    {
        public static readonly int AquaStart = Months.Index(2002, 7);
        public static readonly int SnppStart = Months.Index(2012, 2);
        public static readonly int Noaa20Start = Months.Index(2026, 11); // Suomi NPP left FIRMS on 2026-11-02 15:40 UTC
        public static int RefSat(int t)
        {
            if (t < AquaStart) return Sat.Terra;
            if (t < SnppStart) return Sat.Aqua;
            if (t < Noaa20Start) return Sat.Snpp;
            return Sat.Noaa20;
        }
    }

    class Program
    {
        const int MaxT = 400;     // months supported (to 2034)
        const double Grid = 0.25; // aggregation grid in degrees
        const int Cols = 1440, Rows = 720;

        static int Main(string[] args)
        {
            CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
            System.Threading.Thread.CurrentThread.CurrentCulture = CultureInfo.InvariantCulture;
            if (args.Length < 3) { Console.WriteLine("usage: aggregate <zipDir> <workDir> [par] | build <workDir> <outDir> [tileRes]"); return 1; }
            var sw = System.Diagnostics.Stopwatch.StartNew();
            if (args[0] == "aggregate")
            {
                int par = args.Length > 3 ? int.Parse(args[3]) : 6;
                Aggregate(args[1], args[2], par);
            }
            else if (args[0] == "build")
            {
                double tileRes = args.Length > 3 ? double.Parse(args[3], CultureInfo.InvariantCulture) : 0.25;
                Build(args[1], args[2], tileRes);
            }
            else if (args[0] == "ingest-api")
            {
                if (args.Length < 4) { Console.WriteLine("usage: ingest-api <apiDir> <zipDir> <workDir>"); return 1; }
                IngestApi(args[1], args[2], args[3]);
            }
            else { Console.WriteLine("unknown command"); return 1; }
            Console.WriteLine("Done in " + sw.Elapsed.TotalSeconds.ToString("0.0") + " s");
            return 0;
        }

        // ------------------------------------------------------------------ countries registry
        static readonly object CountryLock = new object();
        static Dictionary<string, int> CountryIds = new Dictionary<string, int>();
        static List<string> CountryNames = new List<string>();

        static void LoadCountries(string workDir)
        {
            string p = Path.Combine(workDir, "countries.txt");
            if (!File.Exists(p)) return;
            foreach (var line in File.ReadAllLines(p, Encoding.UTF8))
            {
                if (line.Trim().Length == 0) continue;
                var parts = line.Split('\t');
                int id = int.Parse(parts[0]);
                while (CountryNames.Count <= id) CountryNames.Add(null);
                CountryNames[id] = parts[1];
                CountryIds[parts[1]] = id;
            }
        }

        static void SaveCountries(string workDir)
        {
            var sb = new StringBuilder();
            for (int i = 0; i < CountryNames.Count; i++) sb.Append(i).Append('\t').Append(CountryNames[i]).Append('\n');
            File.WriteAllText(Path.Combine(workDir, "countries.txt"), sb.ToString(), Encoding.UTF8);
        }

        static int CountryId(string name)
        {
            lock (CountryLock)
            {
                int id;
                if (CountryIds.TryGetValue(name, out id)) return id;
                id = CountryNames.Count;
                CountryNames.Add(name);
                CountryIds[name] = id;
                return id;
            }
        }

        // ------------------------------------------------------------------ aggregate
        static readonly object LogLock = new object();

        static void Aggregate(string zipDir, string workDir, int par)
        {
            Directory.CreateDirectory(workDir);
            LoadCountries(workDir);
            var zips = Directory.GetFiles(zipDir, "*_all_countries.zip").OrderByDescending(f => new FileInfo(f).Length).ToList();
            Console.WriteLine("Zips: " + zips.Count + ", parallelism " + par);
            Parallel.ForEach(zips, new ParallelOptions { MaxDegreeOfParallelism = par }, z =>
            {
                try { ProcessZip(z, workDir); }
                catch (Exception ex) { lock (LogLock) Console.WriteLine("ERROR " + Path.GetFileName(z) + ": " + ex.Message); }
            });
            SaveCountries(workDir);
        }

        static void ProcessZip(string zipPath, string workDir)
        {
            string fn = Path.GetFileNameWithoutExtension(zipPath); // e.g. viirs-snpp_2013_all_countries
            string[] parts = fn.Split('_');
            string sensor = parts[0];
            int year = int.Parse(parts[1]);
            string outPath = Path.Combine(workDir, sensor + "_" + year + ".bin");
            if (File.Exists(outPath) && File.GetLastWriteTimeUtc(outPath) > File.GetLastWriteTimeUtc(zipPath))
            {
                lock (LogLock) Console.WriteLine("skip " + fn);
                return;
            }
            int fixedSat = sensor == "viirs-snpp" ? Sat.Snpp : sensor == "viirs-jpss1" ? Sat.Noaa20 : sensor == "viirs-jpss2" ? Sat.Noaa21 : -1;
            bool modis = fixedSat < 0;

            var dict = new Dictionary<long, int[]>(1 << 20);
            long rows = 0, kept = 0, dropType = 0, dropConf = 0, bad = 0;
            var typeCounts = new long[5];
            var sw = System.Diagnostics.Stopwatch.StartNew();
            int[] fs = new int[24], fe = new int[24];

            using (var za = ZipFile.OpenRead(zipPath))
            {
                foreach (var e in za.Entries)
                {
                    if (!e.Name.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)) continue;
                    string name = Path.GetFileNameWithoutExtension(e.Name);
                    int i1 = name.IndexOf('_');
                    int i2 = i1 < 0 ? -1 : name.IndexOf('_', i1 + 1);
                    string country = i2 < 0 ? name : name.Substring(i2 + 1);
                    int cid = CountryId(country);

                    using (var sr = new StreamReader(e.Open(), Encoding.ASCII, false, 1 << 17))
                    {
                        string header = sr.ReadLine();
                        if (header == null) continue;
                        var cols = header.Split(',');
                        int iLat = Array.IndexOf(cols, "latitude"), iLon = Array.IndexOf(cols, "longitude");
                        int iDate = Array.IndexOf(cols, "acq_date"), iSat = Array.IndexOf(cols, "satellite");
                        int iConf = Array.IndexOf(cols, "confidence"), iDn = Array.IndexOf(cols, "daynight");
                        int iType = Array.IndexOf(cols, "type");
                        int maxField = Math.Max(Math.Max(Math.Max(iLat, iLon), Math.Max(iDate, iSat)), Math.Max(Math.Max(iConf, iDn), iType));
                        string line;
                        while ((line = sr.ReadLine()) != null)
                        {
                            rows++;
                            int nf = SplitFields(line, fs, fe, maxField + 1);
                            if (nf <= Math.Max(iLat, Math.Max(iLon, Math.Max(iDate, iDn)))) { bad++; continue; }

                            int type = 0;
                            if (iType >= 0 && iType < nf && fe[iType] > fs[iType])
                            {
                                char tc = line[fs[iType]];
                                type = tc >= '0' && tc <= '9' ? tc - '0' : 0;
                            }
                            if (type >= 0 && type < 5) typeCounts[type]++;
                            if (type != 0) { dropType++; continue; }

                            if (iConf >= 0 && iConf < nf && fe[iConf] > fs[iConf])
                            {
                                char c0 = line[fs[iConf]];
                                if (modis)
                                {
                                    int conf = ParseInt(line, fs[iConf], fe[iConf]);
                                    if (conf < 30) { dropConf++; continue; }
                                }
                                else if (c0 == 'l' || c0 == 'L') { dropConf++; continue; }
                            }

                            int sat = fixedSat;
                            if (modis)
                            {
                                char sc = iSat >= 0 && iSat < nf && fe[iSat] > fs[iSat] ? line[fs[iSat]] : '?';
                                if (sc == 'T' || sc == 't') sat = Sat.Terra;
                                else if (sc == 'A' || sc == 'a') sat = Sat.Aqua;
                                else { bad++; continue; }
                            }

                            double lat = ParseDouble(line, fs[iLat], fe[iLat]);
                            double lon = ParseDouble(line, fs[iLon], fe[iLon]);
                            if (double.IsNaN(lat) || double.IsNaN(lon)) { bad++; continue; }
                            int ds = fs[iDate];
                            if (fe[iDate] - ds < 7) { bad++; continue; }
                            int y = (line[ds] - '0') * 1000 + (line[ds + 1] - '0') * 100 + (line[ds + 2] - '0') * 10 + (line[ds + 3] - '0');
                            int m = (line[ds + 5] - '0') * 10 + (line[ds + 6] - '0');
                            int t = Months.Index(y, m);
                            if (t < 0 || t >= MaxT || m < 1 || m > 12) { bad++; continue; }
                            int dn = (fe[iDn] > fs[iDn] && line[fs[iDn]] == 'N') ? 1 : 0;

                            int row = (int)Math.Floor((lat + 90.0) / Grid); if (row < 0) row = 0; if (row >= Rows) row = Rows - 1;
                            int col = (int)Math.Floor((lon + 180.0) / Grid); if (col < 0) col = 0; if (col >= Cols) col = Cols - 1;
                            long cell = row * Cols + col;
                            long key = ((long)cid << 33) | (cell << 12) | ((long)t << 3) | (long)sat;
                            int[] v;
                            if (!dict.TryGetValue(key, out v)) { v = new int[2]; dict[key] = v; }
                            v[dn]++;
                            kept++;
                        }
                    }
                }
            }

            string tmp = outPath + ".tmp";
            using (var bw = new BinaryWriter(new BufferedStream(File.Create(tmp), 1 << 20)))
            {
                bw.Write(dict.Count);
                foreach (var kv in dict)
                {
                    long k = kv.Key;
                    bw.Write((short)(k >> 33));
                    bw.Write((int)((k >> 12) & 0x1FFFFF));
                    bw.Write((short)((k >> 3) & 0x1FF));
                    bw.Write((byte)(k & 7));
                    bw.Write(kv.Value[0]);
                    bw.Write(kv.Value[1]);
                }
            }
            if (File.Exists(outPath)) File.Delete(outPath);
            File.Move(tmp, outPath);
            File.WriteAllText(outPath.Replace(".bin", ".stats.json"),
                "{\"unit\":\"" + sensor + "_" + year + "\",\"rows\":" + rows + ",\"kept\":" + kept + ",\"dropType\":" + dropType +
                ",\"dropConf\":" + dropConf + ",\"bad\":" + bad + ",\"type\":[" + string.Join(",", typeCounts) + "],\"keys\":" + dict.Count + "}");
            lock (LogLock) Console.WriteLine(fn + ": rows " + rows + ", kept " + kept + ", keys " + dict.Count + ", " + sw.Elapsed.TotalSeconds.ToString("0") + " s");
        }

        static int SplitFields(string line, int[] fs, int[] fe, int need)
        {
            int n = 0, start = 0, len = line.Length;
            for (int i = 0; i <= len && n < fs.Length; i++)
            {
                if (i == len || line[i] == ',')
                {
                    fs[n] = start; fe[n] = i; n++;
                    start = i + 1;
                    if (n >= need) break;
                }
            }
            return n;
        }

        static int ParseInt(string s, int a, int b)
        {
            int v = 0; bool any = false;
            for (int i = a; i < b; i++) { char c = s[i]; if (c >= '0' && c <= '9') { v = v * 10 + (c - '0'); any = true; } else if (c == '.') break; }
            return any ? v : -1;
        }

        static double ParseDouble(string s, int a, int b)
        {
            if (b <= a) return double.NaN;
            bool neg = false; int i = a;
            if (s[i] == '-') { neg = true; i++; } else if (s[i] == '+') i++;
            double v = 0; bool any = false;
            for (; i < b && s[i] >= '0' && s[i] <= '9'; i++) { v = v * 10 + (s[i] - '0'); any = true; }
            if (i < b && s[i] == '.')
            {
                i++; double scale = 0.1;
                for (; i < b && s[i] >= '0' && s[i] <= '9'; i++) { v += (s[i] - '0') * scale; scale *= 0.1; any = true; }
            }
            if (!any) return double.NaN;
            return neg ? -v : v;
        }

        // ------------------------------------------------------------------ ingest FIRMS API CSVs (2026)
        // API rows carry no country and near-real-time rows carry no 'type'. Country comes from the dominant
        // country of the 0.25-degree cell in the archive; static sources are removed with a mask of archive
        // detections flagged type 1-3 (volcano, static land source, offshore) on a 0.02-degree grid.
        static long MaskKey(double lat, double lon) { return ((long)Math.Round(lat * 50) + 10000) * 100000 + ((long)Math.Round(lon * 50) + 20000); }

        static HashSet<long> BuildStaticMask(string zipDir, string workDir)
        {
            string cache = Path.Combine(workDir, "static_mask.txt");
            var mask = new HashSet<long>();
            if (File.Exists(cache))
            {
                foreach (var l in File.ReadLines(cache)) if (l.Length > 0) mask.Add(long.Parse(l));
                Console.WriteLine("Static mask (cached): " + mask.Count + " locations");
                return mask;
            }
            var names = new[] { "viirs-jpss1_2025", "viirs-snpp_2025", "viirs-jpss1_2024", "viirs-snpp_2024", "modis_2025" };
            int[] fs = new int[24], fe = new int[24];
            foreach (var n in names)
            {
                string z = Path.Combine(zipDir, n + "_all_countries.zip");
                if (!File.Exists(z)) continue;
                using (var za = ZipFile.OpenRead(z))
                    foreach (var e in za.Entries)
                    {
                        if (!e.Name.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)) continue;
                        using (var sr = new StreamReader(e.Open(), Encoding.ASCII, false, 1 << 17))
                        {
                            var cols = (sr.ReadLine() ?? "").Split(',');
                            int iLat = Array.IndexOf(cols, "latitude"), iLon = Array.IndexOf(cols, "longitude"), iType = Array.IndexOf(cols, "type");
                            if (iType < 0) continue;
                            string line;
                            while ((line = sr.ReadLine()) != null)
                            {
                                int nf = SplitFields(line, fs, fe, iType + 1);
                                if (nf <= iType || fe[iType] <= fs[iType]) continue;
                                char tc = line[fs[iType]];
                                if (tc < '1' || tc > '3') continue;
                                double lat = ParseDouble(line, fs[iLat], fe[iLat]), lon = ParseDouble(line, fs[iLon], fe[iLon]);
                                if (!double.IsNaN(lat) && !double.IsNaN(lon)) mask.Add(MaskKey(lat, lon));
                            }
                        }
                    }
                Console.WriteLine("  mask after " + n + ": " + mask.Count);
            }
            File.WriteAllLines(cache, mask.Select(x => x.ToString(CultureInfo.InvariantCulture)));
            return mask;
        }

        static bool IsStatic(HashSet<long> mask, double lat, double lon)
        {
            for (int a = -1; a <= 1; a++)
                for (int b = -1; b <= 1; b++)
                    if (mask.Contains(MaskKey(lat + a * 0.02, lon + b * 0.02))) return true;
            return false;
        }

        static void IngestApi(string apiDir, string zipDir, string workDir)
        {
            LoadCountries(workDir);
            var mask = BuildStaticMask(zipDir, workDir);

            // dominant archive country per 0.25-degree cell
            var weights = new Dictionary<long, long>();
            foreach (var b in Directory.GetFiles(workDir, "*.bin").Where(p => !Path.GetFileName(p).StartsWith("api")))
                foreach (var r in ReadBin(b))
                {
                    long k = ((long)r.Cell << 11) | (long)r.C;
                    long w; weights.TryGetValue(k, out w); weights[k] = w + r.D + r.N;
                }
            var cellCountry = new Dictionary<int, int>(); var cellW = new Dictionary<int, long>();
            foreach (var kv in weights)
            {
                int cell = (int)(kv.Key >> 11), c = (int)(kv.Key & 2047);
                long bw;
                if (!cellW.TryGetValue(cell, out bw) || kv.Value > bw) { cellW[cell] = kv.Value; cellCountry[cell] = c; }
            }
            Console.WriteLine("Cell->country map: " + cellCountry.Count + " cells");
            int unassigned = CountryId("Unassigned");

            var dict = new Dictionary<long, int[]>(1 << 20);
            long rows = 0, kept = 0, dropType = 0, dropStatic = 0, dropConf = 0, bad = 0, noCountry = 0;
            string maxDate = "";
            int[] fs = new int[24], fe = new int[24];
            foreach (var dir in Directory.GetDirectories(apiDir))
            {
                string src = Path.GetFileName(dir).ToUpperInvariant();
                bool modis = src.StartsWith("MODIS");
                int fixedSat = src.StartsWith("VIIRS_SNPP") ? Sat.Snpp : src.StartsWith("VIIRS_NOAA20") ? Sat.Noaa20 : src.StartsWith("VIIRS_NOAA21") ? Sat.Noaa21 : -1;
                if (!modis && fixedSat < 0) continue;
                foreach (var f in Directory.GetFiles(dir, "*.csv").OrderBy(p => p))
                    using (var sr = new StreamReader(f, Encoding.ASCII, false, 1 << 17))
                    {
                        var cols = (sr.ReadLine() ?? "").Split(',');
                        int iLat = Array.IndexOf(cols, "latitude"), iLon = Array.IndexOf(cols, "longitude");
                        int iDate = Array.IndexOf(cols, "acq_date"), iSat = Array.IndexOf(cols, "satellite");
                        int iConf = Array.IndexOf(cols, "confidence"), iDn = Array.IndexOf(cols, "daynight"), iType = Array.IndexOf(cols, "type");
                        if (iLat < 0 || iDate < 0) continue;
                        int maxField = new[] { iLat, iLon, iDate, iSat, iConf, iDn, iType }.Max();
                        string line;
                        while ((line = sr.ReadLine()) != null)
                        {
                            rows++;
                            int nf = SplitFields(line, fs, fe, maxField + 1);
                            if (nf <= Math.Max(iLat, Math.Max(iLon, Math.Max(iDate, iDn)))) { bad++; continue; }
                            double lat = ParseDouble(line, fs[iLat], fe[iLat]), lon = ParseDouble(line, fs[iLon], fe[iLon]);
                            if (double.IsNaN(lat) || double.IsNaN(lon)) { bad++; continue; }
                            if (iType >= 0 && iType < nf && fe[iType] > fs[iType])
                            {
                                if (line[fs[iType]] != '0') { dropType++; continue; }
                            }
                            else if (IsStatic(mask, lat, lon)) { dropStatic++; continue; }
                            if (iConf >= 0 && iConf < nf && fe[iConf] > fs[iConf])
                            {
                                char c0 = line[fs[iConf]];
                                if (modis) { if (ParseInt(line, fs[iConf], fe[iConf]) < 30) { dropConf++; continue; } }
                                else if (c0 == 'l' || c0 == 'L') { dropConf++; continue; }
                            }
                            int sat = fixedSat;
                            if (modis)
                            {
                                char sc = iSat >= 0 && iSat < nf && fe[iSat] > fs[iSat] ? line[fs[iSat]] : '?';
                                if (sc == 'T' || sc == 't') sat = Sat.Terra; else if (sc == 'A' || sc == 'a') sat = Sat.Aqua; else { bad++; continue; }
                            }
                            int ds = fs[iDate];
                            if (fe[iDate] - ds < 10) { bad++; continue; }
                            string date = line.Substring(ds, 10);
                            if (string.CompareOrdinal(date, maxDate) > 0) maxDate = date;
                            int y = int.Parse(date.Substring(0, 4)), m = int.Parse(date.Substring(5, 2));
                            int t = Months.Index(y, m);
                            if (t < 0 || t >= MaxT) { bad++; continue; }
                            int dn = (fe[iDn] > fs[iDn] && line[fs[iDn]] == 'N') ? 1 : 0;
                            int row = (int)Math.Floor((lat + 90.0) / Grid); if (row < 0) row = 0; if (row >= Rows) row = Rows - 1;
                            int col = (int)Math.Floor((lon + 180.0) / Grid); if (col < 0) col = 0; if (col >= Cols) col = Cols - 1;
                            int cell = row * Cols + col;
                            int cid;
                            if (!cellCountry.TryGetValue(cell, out cid))
                            {
                                cid = -1;
                                for (int rad = 1; rad <= 4 && cid < 0; rad++)
                                    for (int dr = -rad; dr <= rad && cid < 0; dr++)
                                        for (int dc = -rad; dc <= rad && cid < 0; dc++)
                                        {
                                            int rr = row + dr, cc = (col + dc + Cols) % Cols;
                                            int found;
                                            if (rr >= 0 && rr < Rows && cellCountry.TryGetValue(rr * Cols + cc, out found)) cid = found;
                                        }
                                if (cid < 0) { cid = unassigned; noCountry++; }
                                cellCountry[cell] = cid;
                            }
                            long key = ((long)cid << 33) | ((long)cell << 12) | ((long)t << 3) | (long)sat;
                            int[] v;
                            if (!dict.TryGetValue(key, out v)) { v = new int[2]; dict[key] = v; }
                            v[dn]++;
                            kept++;
                        }
                    }
                Console.WriteLine("  " + src + " done, rows so far " + rows);
            }
            string outPath = Path.Combine(workDir, "api_2026.bin");
            using (var bw = new BinaryWriter(new BufferedStream(File.Create(outPath), 1 << 20)))
            {
                bw.Write(dict.Count);
                foreach (var kv in dict)
                {
                    long k = kv.Key;
                    bw.Write((short)(k >> 33)); bw.Write((int)((k >> 12) & 0x1FFFFF)); bw.Write((short)((k >> 3) & 0x1FF)); bw.Write((byte)(k & 7));
                    bw.Write(kv.Value[0]); bw.Write(kv.Value[1]);
                }
            }
            File.WriteAllText(Path.Combine(workDir, "api_2026.stats.json"),
                "{\"unit\":\"api_2026\",\"rows\":" + rows + ",\"kept\":" + kept + ",\"dropType\":" + dropType + ",\"dropStatic\":" + dropStatic +
                ",\"dropConf\":" + dropConf + ",\"bad\":" + bad + ",\"unassigned\":" + noCountry + ",\"keys\":" + dict.Count + ",\"lastDate\":\"" + maxDate + "\"}");
            File.WriteAllText(Path.Combine(workDir, "last_date.txt"), maxDate);
            SaveCountries(workDir);
            Console.WriteLine("API rows " + rows + ", kept " + kept + ", static removed " + dropStatic + ", last date " + maxDate);
        }

        // ------------------------------------------------------------------ build
        struct Rec { public short C; public int Cell; public short T; public byte S; public int D; public int N; }

        static IEnumerable<Rec> ReadBin(string path)
        {
            using (var br = new BinaryReader(new BufferedStream(File.OpenRead(path), 1 << 20)))
            {
                int n = br.ReadInt32();
                for (int i = 0; i < n; i++)
                {
                    Rec r;
                    r.C = br.ReadInt16(); r.Cell = br.ReadInt32(); r.T = br.ReadInt16(); r.S = br.ReadByte(); r.D = br.ReadInt32(); r.N = br.ReadInt32();
                    yield return r;
                }
            }
        }

        // Hierarchical ratio factor: refSum/modSum, shrunk toward parent with k pseudo-detections.
        static double Shrink(double refSum, double modSum, double parent, double k)
        {
            return (refSum + k * parent) / (modSum + k);
        }

        class Factors
        {
            // [country][calMonth][dn]
            public double[][][] F;
            public double[] Global = new double[2];
        }

        // tot[c][t][sat][dn]
        static Factors FitFactors(long[][][][] tot, int nC, int fromSat, int refSat, int t0, int t1, double k)
        {
            var f = new Factors { F = new double[nC][][] };
            double[] gR = new double[2], gM = new double[2];
            var cR = new double[nC, 2]; var cM = new double[nC, 2];
            var cmR = new double[nC, 12, 2]; var cmM = new double[nC, 12, 2];
            for (int c = 0; c < nC; c++)
                for (int t = t0; t <= t1 && t < MaxT; t++)
                {
                    int cm = Months.CalMonth(t);
                    for (int dn = 0; dn < 2; dn++)
                    {
                        double r = tot[c][t][refSat][dn], m = tot[c][t][fromSat][dn];
                        gR[dn] += r; gM[dn] += m; cR[c, dn] += r; cM[c, dn] += m; cmR[c, cm, dn] += r; cmM[c, cm, dn] += m;
                    }
                }
            for (int dn = 0; dn < 2; dn++) f.Global[dn] = gM[dn] > 0 ? gR[dn] / gM[dn] : 1.0;
            for (int c = 0; c < nC; c++)
            {
                f.F[c] = new double[12][];
                double[] fc = new double[2];
                for (int dn = 0; dn < 2; dn++) fc[dn] = Shrink(cR[c, dn], cM[c, dn], f.Global[dn], k);
                for (int cm = 0; cm < 12; cm++)
                {
                    f.F[c][cm] = new double[2];
                    for (int dn = 0; dn < 2; dn++) f.F[c][cm][dn] = Shrink(cmR[c, cm, dn], cmM[c, cm, dn], fc[dn], k);
                }
            }
            return f;
        }

        static double Predict(long[][][][] tot, Factors f, int c, int t, int fromSat)
        {
            int cm = Months.CalMonth(t);
            return tot[c][t][fromSat][0] * f.F[c][cm][0] + tot[c][t][fromSat][1] * f.F[c][cm][1];
        }

        static void Build(string workDir, string outDir, double tileRes)
        {
            LoadCountries(workDir);
            int nC = CountryNames.Count;
            var bins = Directory.GetFiles(workDir, "*.bin").OrderBy(p => p).ToList();
            Console.WriteLine("Units: " + bins.Count + ", countries: " + nC);

            // ---- Phase A: country x month x satellite x day/night totals
            var tot = new long[nC][][][];
            for (int c = 0; c < nC; c++)
            {
                tot[c] = new long[MaxT][][];
                for (int t = 0; t < MaxT; t++) { tot[c][t] = new long[Sat.Count][]; for (int s = 0; s < Sat.Count; s++) tot[c][t][s] = new long[2]; }
            }
            int lastT = 0;
            var satLast = new int[Sat.Count]; var satFirst = new int[Sat.Count];
            for (int s = 0; s < Sat.Count; s++) { satFirst[s] = int.MaxValue; satLast[s] = -1; }
            foreach (var b in bins)
                foreach (var r in ReadBin(b))
                {
                    tot[r.C][r.T][r.S][0] += r.D; tot[r.C][r.T][r.S][1] += r.N;
                    if (r.T > lastT) lastT = r.T;
                    if (r.T > satLast[r.S]) satLast[r.S] = r.T;
                    if (r.T < satFirst[r.S]) satFirst[r.S] = r.T;
                }
            Console.WriteLine("Last month in data: " + Months.Label(lastT));

            // ---- Factors (the continuity engine)
            const double K = 30.0;
            int ovA0 = Months.Index(2012, 2), ovA1 = Months.Index(2021, 12);   // Aqua vs Suomi NPP, before Aqua's orbit drift
            int ovT0 = Months.Index(2012, 2), ovT1 = Months.Index(2019, 12);   // Terra vs Suomi NPP, before Terra's drift
            int ovN0 = Months.Index(2018, 4), ovN1 = Months.Index(2025, 12);   // NOAA-20 vs Suomi NPP
            var fA = FitFactors(tot, nC, Sat.Aqua, Sat.Snpp, ovA0, ovA1, K);
            var fT = FitFactors(tot, nC, Sat.Terra, Sat.Snpp, ovT0, ovT1, K);
            var fN = FitFactors(tot, nC, Sat.Noaa20, Sat.Snpp, ovN0, Math.Min(ovN1, lastT), K);
            Console.WriteLine("Global factors Aqua->VIIRS day " + fA.Global[0].ToString("0.00") + " night " + fA.Global[1].ToString("0.00") +
                              "; Terra day " + fT.Global[0].ToString("0.00") + " night " + fT.Global[1].ToString("0.00") +
                              "; NOAA-20 day " + fN.Global[0].ToString("0.00") + " night " + fN.Global[1].ToString("0.00"));

            // ---- Uncertainty multipliers per country x calendar month from interannual spread of Aqua ratios
            var lo = new double[nC][]; var hi = new double[nC][];
            for (int c = 0; c < nC; c++)
            {
                lo[c] = new double[12]; hi[c] = new double[12];
                for (int cm = 0; cm < 12; cm++)
                {
                    var ratios = new List<double>();
                    double pooledR = 0, pooledM = 0;
                    for (int t = ovA0; t <= ovA1; t++)
                    {
                        if (Months.CalMonth(t) != cm) continue;
                        double r = tot[c][t][Sat.Snpp][0] + tot[c][t][Sat.Snpp][1];
                        double m = tot[c][t][Sat.Aqua][0] + tot[c][t][Sat.Aqua][1];
                        pooledR += r; pooledM += m;
                        if (m >= 10) ratios.Add(r / m);
                    }
                    if (ratios.Count >= 3 && pooledM > 0)
                    {
                        ratios.Sort();
                        double pooled = pooledR / pooledM;
                        double q25 = Quantile(ratios, 0.25), q75 = Quantile(ratios, 0.75);
                        lo[c][cm] = Clamp(q25 / pooled, 0.3, 1.0);
                        hi[c][cm] = Clamp(q75 / pooled, 1.0, 3.0);
                    }
                    else { lo[c][cm] = 0.6; hi[c][cm] = 1.6; } // conservative default when the overlap is too thin
                }
            }

            // ---- Validation: hindcast (train 2012-02..2017-12, test 2018-01..2021-12)
            string validationJson = Validate(tot, nC, K);
            Directory.CreateDirectory(outDir);
            File.WriteAllText(Path.Combine(outDir, "validation.json"), validationJson, Encoding.UTF8);

            // ---- Country calendars
            Directory.CreateDirectory(Path.Combine(outDir, "cal"));
            int nT = lastT + 1;
            var worldH = new double[nT]; var worldLo = new double[nT]; var worldHi = new double[nT];
            var worldRaw = new double[Sat.Count, nT];
            var countryTotals = new double[nC];
            for (int c = 0; c < nC; c++)
            {
                var H = new double[nT]; var L = new double[nT]; var U = new double[nT];
                for (int t = 0; t < nT; t++)
                {
                    int rs = Eras.RefSat(t);
                    double h;
                    if (rs == Sat.Terra) h = Predict(tot, fT, c, t, Sat.Terra);
                    else if (rs == Sat.Aqua) h = Predict(tot, fA, c, t, Sat.Aqua);
                    else if (rs == Sat.Snpp) h = tot[c][t][Sat.Snpp][0] + tot[c][t][Sat.Snpp][1];
                    else h = Predict(tot, fN, c, t, Sat.Noaa20);
                    H[t] = h;
                    bool recon = rs == Sat.Terra || rs == Sat.Aqua;
                    L[t] = recon ? h * lo[c][Months.CalMonth(t)] : h;
                    U[t] = recon ? h * hi[c][Months.CalMonth(t)] : h;
                    worldH[t] += h; worldLo[t] += L[t]; worldHi[t] += U[t];
                    for (int s = 0; s < Sat.Count; s++) worldRaw[s, t] += tot[c][t][s][0] + tot[c][t][s][1];
                    countryTotals[c] += h;
                }
                var raw = new double[Sat.Count, nT];
                for (int t = 0; t < nT; t++) for (int s = 0; s < Sat.Count; s++) raw[s, t] = tot[c][t][s][0] + tot[c][t][s][1];
                File.WriteAllText(Path.Combine(outDir, "cal", c + ".json"), CalendarJson(c.ToString(), CountryNames[c], nT, H, L, U, raw, fA.F[c], lo[c], hi[c]), Encoding.UTF8);
            }
            File.WriteAllText(Path.Combine(outDir, "cal", "world.json"), CalendarJson("world", "World", nT, worldH, worldLo, worldHi, worldRaw, null, null, null), Encoding.UTF8);

            // ---- Phase B: cell-level harmonized values for the globe (1 deg) and AOI tiles (tileRes)
            int gCols = (int)Math.Round(360 / tileRes), gRows = (int)Math.Round(180 / tileRes);
            int tileDeg = 10;
            int cellsPerTile = (int)Math.Round(tileDeg / tileRes);
            // cell -> month -> (H, raw ref)
            var cellMap = new Dictionary<int, Dictionary<int, double[]>>();
            var cellCountry = new Dictionary<int, Dictionary<int, double>>();
            var globe1 = new Dictionary<int, double>[nT];
            for (int t = 0; t < nT; t++) globe1[t] = new Dictionary<int, double>();
            var bbox = new double[nC, 4]; // w s e n
            var cent = new double[nC, 3]; // sumLat*w sumLon*w w
            for (int c = 0; c < nC; c++) { bbox[c, 0] = 999; bbox[c, 1] = 999; bbox[c, 2] = -999; bbox[c, 3] = -999; }

            foreach (var b in bins)
                foreach (var r in ReadBin(b))
                {
                    int t = r.T;
                    if (t >= nT) continue;
                    int rs = Eras.RefSat(t);
                    if (r.S != rs) continue;
                    int cm = Months.CalMonth(t);
                    double h;
                    if (rs == Sat.Snpp) h = r.D + r.N;
                    else
                    {
                        Factors f = rs == Sat.Terra ? fT : rs == Sat.Aqua ? fA : fN;
                        h = r.D * f.F[r.C][cm][0] + r.N * f.F[r.C][cm][1];
                    }
                    int row25 = r.Cell / Cols, col25 = r.Cell % Cols;
                    double lat = -90 + (row25 + 0.5) * Grid, lon = -180 + (col25 + 0.5) * Grid;

                    // country geometry (from detections)
                    double w = r.D + r.N;
                    if (lon < bbox[r.C, 0]) bbox[r.C, 0] = lon; if (lat < bbox[r.C, 1]) bbox[r.C, 1] = lat;
                    if (lon > bbox[r.C, 2]) bbox[r.C, 2] = lon; if (lat > bbox[r.C, 3]) bbox[r.C, 3] = lat;
                    cent[r.C, 0] += lat * w; cent[r.C, 1] += lon * w; cent[r.C, 2] += w;

                    // tile grid
                    int gr = (int)Math.Floor((lat + 90) / tileRes), gc = (int)Math.Floor((lon + 180) / tileRes);
                    int gcell = gr * gCols + gc;
                    Dictionary<int, double[]> series;
                    if (!cellMap.TryGetValue(gcell, out series)) { series = new Dictionary<int, double[]>(); cellMap[gcell] = series; }
                    double[] hv;
                    if (!series.TryGetValue(t, out hv)) { hv = new double[2]; series[t] = hv; }
                    hv[0] += h; hv[1] += r.D + r.N;
                    Dictionary<int, double> cc;
                    if (!cellCountry.TryGetValue(gcell, out cc)) { cc = new Dictionary<int, double>(); cellCountry[gcell] = cc; }
                    double prev; cc.TryGetValue(r.C, out prev); cc[r.C] = prev + w;

                    // globe grid (1 degree)
                    int g1 = (int)Math.Floor(lat + 90) * 360 + (int)Math.Floor(lon + 180);
                    double gp; globe1[t].TryGetValue(g1, out gp); globe1[t][g1] = gp + h;
                }

            // ---- write globe files (one per year, 1-degree cells)
            Directory.CreateDirectory(Path.Combine(outDir, "globe"));
            int yFirst = Months.Year(0), yLast = Months.Year(nT - 1);
            for (int y = yFirst; y <= yLast; y++)
            {
                var sb = new StringBuilder();
                sb.Append("{\"year\":").Append(y).Append(",\"res\":1,\"months\":{");
                bool firstM = true;
                for (int m = 1; m <= 12; m++)
                {
                    int t = Months.Index(y, m);
                    if (t < 0 || t >= nT) continue;
                    if (!firstM) sb.Append(','); firstM = false;
                    sb.Append('"').Append(Months.Label(t)).Append("\":[");
                    bool first = true;
                    foreach (var kv in globe1[t].OrderBy(k => k.Key))
                    {
                        if (kv.Value < 0.5) continue;
                        if (!first) sb.Append(','); first = false;
                        sb.Append(kv.Key).Append(',').Append(Math.Round(kv.Value).ToString(CultureInfo.InvariantCulture));
                    }
                    sb.Append(']');
                }
                sb.Append("}}");
                File.WriteAllText(Path.Combine(outDir, "globe", y + ".json"), sb.ToString(), Encoding.UTF8);
            }

            // ---- per-country, per-year 0.25-degree layers (only the cells of the selected country are drawn)
            string cdir = Path.Combine(outDir, "country");
            if (Directory.Exists(cdir)) Directory.Delete(cdir, true);
            Directory.CreateDirectory(cdir);
            var binYears = bins.GroupBy(p =>
            {
                string n = Path.GetFileNameWithoutExtension(p);
                int us = n.LastIndexOf('_');
                int yy; return us >= 0 && int.TryParse(n.Substring(us + 1), out yy) ? yy : 0;
            }).OrderBy(g => g.Key);
            int countryFiles = 0; long countryBytes = 0;
            foreach (var grp in binYears)
            {
                var acc = new Dictionary<int, Dictionary<int, Dictionary<int, double>>>();
                foreach (var b in grp)
                    foreach (var r in ReadBin(b))
                    {
                        int t = r.T;
                        if (t >= nT || CountryNames[r.C] == "Unassigned") continue;
                        int rs = Eras.RefSat(t);
                        if (r.S != rs) continue;
                        int cm = Months.CalMonth(t);
                        double h;
                        if (rs == Sat.Snpp) h = r.D + r.N;
                        else { Factors f = rs == Sat.Terra ? fT : rs == Sat.Aqua ? fA : fN; h = r.D * f.F[r.C][cm][0] + r.N * f.F[r.C][cm][1]; }
                        Dictionary<int, Dictionary<int, double>> byT;
                        if (!acc.TryGetValue(r.C, out byT)) { byT = new Dictionary<int, Dictionary<int, double>>(); acc[r.C] = byT; }
                        Dictionary<int, double> cells;
                        if (!byT.TryGetValue(t, out cells)) { cells = new Dictionary<int, double>(); byT[t] = cells; }
                        double prev; cells.TryGetValue(r.Cell, out prev); cells[r.Cell] = prev + h;
                    }
                foreach (var ck in acc)
                {
                    var byYearOut = ck.Value.GroupBy(kv => Months.Year(kv.Key));
                    foreach (var yg in byYearOut)
                    {
                        var sb = new StringBuilder();
                        sb.Append("{\"res\":0.25,\"months\":{");
                        bool fm = true;
                        foreach (var tm in yg.OrderBy(x => x.Key))
                        {
                            if (!fm) sb.Append(','); fm = false;
                            sb.Append('"').Append(Months.Label(tm.Key)).Append("\":[");
                            bool fcell = true;
                            foreach (var cv in tm.Value.OrderBy(x => x.Key))
                            {
                                long v10 = (long)Math.Round(cv.Value * 10);
                                if (v10 <= 0) continue;
                                if (!fcell) sb.Append(','); fcell = false;
                                sb.Append(cv.Key).Append(',').Append(v10);
                            }
                            sb.Append(']');
                        }
                        sb.Append("}}");
                        string dir = Path.Combine(cdir, ck.Key.ToString());
                        Directory.CreateDirectory(dir);
                        string s = sb.ToString();
                        // years of one country can arrive from several binary groups (e.g. 2026 = api + archives); merge by rewriting
                        string fp = Path.Combine(dir, yg.Key + ".json");
                        if (File.Exists(fp)) s = MergeCountryYear(File.ReadAllText(fp), s);
                        File.WriteAllText(fp, s, Encoding.UTF8);
                        countryFiles++; countryBytes += s.Length;
                    }
                }
            }
            Console.WriteLine("Country-year layers: " + countryFiles + " files, MB " + (countryBytes / 1048576.0).ToString("0.0"));

            // ---- write AOI tiles
            string tileDir = Path.Combine(outDir, "tiles");
            if (Directory.Exists(tileDir)) foreach (var f in Directory.GetFiles(tileDir)) File.Delete(f);
            Directory.CreateDirectory(tileDir);
            var byTile = new Dictionary<string, List<int>>();
            foreach (var gcell in cellMap.Keys)
            {
                int gr = gcell / gCols, gc = gcell % gCols;
                string tk = (gc / cellsPerTile) + "_" + (gr / cellsPerTile);
                List<int> lst;
                if (!byTile.TryGetValue(tk, out lst)) { lst = new List<int>(); byTile[tk] = lst; }
                lst.Add(gcell);
            }
            long entries = 0, bytes = 0;
            var tileIndex = new StringBuilder();
            tileIndex.Append('[');
            bool firstTile = true;
            foreach (var kv in byTile.OrderBy(k => k.Key))
            {
                var sb = new StringBuilder();
                sb.Append("{\"res\":").Append(tileRes.ToString(CultureInfo.InvariantCulture)).Append(",\"cols\":").Append(gCols).Append(",\"cells\":[");
                bool firstCell = true;
                foreach (var gcell in kv.Value.OrderBy(x => x))
                {
                    var series = cellMap[gcell];
                    int dom = cellCountry[gcell].OrderByDescending(x => x.Value).First().Key;
                    if (!firstCell) sb.Append(','); firstCell = false;
                    sb.Append('[').Append(gcell).Append(',').Append(dom).Append(",[");
                    bool fe = true;
                    foreach (var tv in series.OrderBy(x => x.Key))
                    {
                        if (!fe) sb.Append(','); fe = false;
                        sb.Append(tv.Key).Append(',').Append(Math.Round(tv.Value[0] * 10)).Append(',').Append(tv.Value[1]);
                        entries++;
                    }
                    sb.Append("]]");
                }
                sb.Append("]}");
                string s = sb.ToString();
                bytes += s.Length;
                File.WriteAllText(Path.Combine(tileDir, kv.Key + ".json"), s, Encoding.UTF8);
                if (!firstTile) tileIndex.Append(','); firstTile = false;
                tileIndex.Append('"').Append(kv.Key).Append('"');
            }
            tileIndex.Append(']');
            Console.WriteLine("Tiles: " + byTile.Count + ", cell-month entries: " + entries + ", MB: " + (bytes / 1048576.0).ToString("0.0"));

            // ---- countries.json
            var csb = new StringBuilder();
            csb.Append('[');
            bool fc = true;
            for (int c = 0; c < nC; c++)
            {
                if (cent[c, 2] <= 0 || CountryNames[c] == "Unassigned") continue;
                if (!fc) csb.Append(','); fc = false;
                csb.Append("{\"id\":").Append(c).Append(",\"name\":").Append(JsonStr(CountryNames[c].Replace('_', ' ')))
                   .Append(",\"lat\":").Append(R(cent[c, 0] / cent[c, 2], 2)).Append(",\"lon\":").Append(R(cent[c, 1] / cent[c, 2], 2))
                   .Append(",\"bbox\":[").Append(R(bbox[c, 0], 2)).Append(',').Append(R(bbox[c, 1], 2)).Append(',').Append(R(bbox[c, 2], 2)).Append(',').Append(R(bbox[c, 3], 2)).Append(']')
                   .Append(",\"total\":").Append(Math.Round(countryTotals[c])).Append('}');
            }
            csb.Append(']');
            File.WriteAllText(Path.Combine(outDir, "countries.json"), csb.ToString(), Encoding.UTF8);

            // ---- factors.json (per-country multipliers for AOI uncertainty + transparency)
            var fsb = new StringBuilder();
            fsb.Append("{\"k\":").Append(K).Append(",\"global\":{\"aqua\":[").Append(R(fA.Global[0], 3)).Append(',').Append(R(fA.Global[1], 3))
               .Append("],\"terra\":[").Append(R(fT.Global[0], 3)).Append(',').Append(R(fT.Global[1], 3))
               .Append("],\"noaa20\":[").Append(R(fN.Global[0], 3)).Append(',').Append(R(fN.Global[1], 3)).Append("]},\"countries\":{");
            bool ff = true;
            for (int c = 0; c < nC; c++)
            {
                if (cent[c, 2] <= 0) continue;
                if (!ff) fsb.Append(','); ff = false;
                fsb.Append('"').Append(c).Append("\":{\"aD\":[").Append(string.Join(",", Enumerable.Range(0, 12).Select(m => R(fA.F[c][m][0], 3))))
                   .Append("],\"aN\":[").Append(string.Join(",", Enumerable.Range(0, 12).Select(m => R(fA.F[c][m][1], 3))))
                   .Append("],\"lo\":[").Append(string.Join(",", lo[c].Select(v => R(v, 3))))
                   .Append("],\"hi\":[").Append(string.Join(",", hi[c].Select(v => R(v, 3)))).Append("]}");
            }
            fsb.Append("}}");
            File.WriteAllText(Path.Combine(outDir, "factors.json"), fsb.ToString(), Encoding.UTF8);

            // ---- meta.json
            var stats = new StringBuilder();
            stats.Append('[');
            bool fs1 = true;
            foreach (var sf in Directory.GetFiles(workDir, "*.stats.json").OrderBy(p => p))
            {
                if (!fs1) stats.Append(','); fs1 = false;
                stats.Append(File.ReadAllText(sf));
            }
            stats.Append(']');
            var msb = new StringBuilder();
            string lastDatePath = Path.Combine(workDir, "last_date.txt");
            string lastDate = File.Exists(lastDatePath) ? File.ReadAllText(lastDatePath).Trim() : "";
            msb.Append("{\"version\":\"0.2.0\",\"generated\":\"").Append(DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")).Append("\"")
               .Append(",\"lastDate\":").Append(lastDate.Length > 0 ? "\"" + lastDate + "\"" : "null")
               .Append(",\"t0\":\"2000-11\",\"months\":").Append(nT).Append(",\"last\":\"").Append(Months.Label(nT - 1)).Append("\"")
               .Append(",\"eras\":[{\"sat\":\"Terra\",\"from\":\"2000-11\",\"to\":\"2002-06\"},{\"sat\":\"Aqua\",\"from\":\"2002-07\",\"to\":\"2012-01\"},{\"sat\":\"Suomi NPP\",\"from\":\"2012-02\",\"to\":\"2026-10\"},{\"sat\":\"NOAA-20\",\"from\":\"2026-11\",\"to\":null}]")
               .Append(",\"tileRes\":").Append(tileRes.ToString(CultureInfo.InvariantCulture)).Append(",\"tileDeg\":").Append(tileDeg).Append(",\"tiles\":").Append(tileIndex)
               .Append(",\"filters\":{\"type\":\"0 only (presumed vegetation fire)\",\"modisConfidence\":\">= 30\",\"viirsConfidence\":\"nominal or high (low excluded)\"}")
               .Append(",\"units\":").Append(stats).Append('}');
            File.WriteAllText(Path.Combine(outDir, "meta.json"), msb.ToString(), Encoding.UTF8);
        }

        // Merge two {"res":..,"months":{"YYYY-MM":[cell,v10,...]}} documents (disjoint months expected; same month: concatenate).
        static string MergeCountryYear(string a, string b)
        {
            var months = new SortedDictionary<string, string>(StringComparer.Ordinal);
            foreach (var doc in new[] { a, b })
            {
                int i = doc.IndexOf("\"months\":{", StringComparison.Ordinal) + 10;
                while (i < doc.Length && doc[i] == '"')
                {
                    int q = doc.IndexOf('"', i + 1);
                    string key = doc.Substring(i + 1, q - i - 1);
                    int lb = doc.IndexOf('[', q), rb = doc.IndexOf(']', lb);
                    string arr = doc.Substring(lb + 1, rb - lb - 1);
                    string prev;
                    months[key] = months.TryGetValue(key, out prev) && prev.Length > 0 ? (arr.Length > 0 ? prev + "," + arr : prev) : arr;
                    i = rb + 1;
                    if (i < doc.Length && doc[i] == ',') i++;
                }
            }
            return "{\"res\":0.25,\"months\":{" + string.Join(",", months.Select(kv => "\"" + kv.Key + "\":[" + kv.Value + "]")) + "}}";
        }

        static string Validate(long[][][][] tot, int nC, double k)
        {
            int tr0 = Months.Index(2012, 2), tr1 = Months.Index(2017, 12);
            int te0 = Months.Index(2018, 1), te1 = Months.Index(2021, 12);
            var fTrain = FitFactors(tot, nC, Sat.Aqua, Sat.Snpp, tr0, tr1, k);
            // naive baseline: one global factor, no strata (what a single OLS-through-origin ratio would do)
            double sR = 0, sM = 0;
            for (int c = 0; c < nC; c++) for (int t = tr0; t <= tr1; t++)
                {
                    sR += tot[c][t][Sat.Snpp][0] + tot[c][t][Sat.Snpp][1];
                    sM += tot[c][t][Sat.Aqua][0] + tot[c][t][Sat.Aqua][1];
                }
            double naive = sM > 0 ? sR / sM : 1;

            var apeE = new List<double>(); var apeN = new List<double>();
            var logO = new List<double>(); var logE = new List<double>(); var logN = new List<double>();
            double sumO = 0, sumE = 0, sumN = 0;
            var scatter = new StringBuilder();
            int sc = 0;
            var perCountry = new List<string>();
            var rnd = new Random(42);
            for (int c = 0; c < nC; c++)
            {
                var cE = new List<double>(); var cN = new List<double>();
                double cO = 0, cEs = 0;
                for (int t = te0; t <= te1; t++)
                {
                    double obs = tot[c][t][Sat.Snpp][0] + tot[c][t][Sat.Snpp][1];
                    double a = tot[c][t][Sat.Aqua][0] + tot[c][t][Sat.Aqua][1];
                    double pe = Predict(tot, fTrain, c, t, Sat.Aqua);
                    double pn = a * naive;
                    if (obs < 20) continue;
                    double ee = Math.Abs(pe - obs) / obs, en = Math.Abs(pn - obs) / obs;
                    apeE.Add(ee); apeN.Add(en); cE.Add(ee); cN.Add(en);
                    logO.Add(Math.Log(1 + obs)); logE.Add(Math.Log(1 + pe)); logN.Add(Math.Log(1 + pn));
                    sumO += obs; sumE += pe; sumN += pn; cO += obs; cEs += pe;
                    if (rnd.NextDouble() < 0.35 && sc < 2500)
                    {
                        if (sc > 0) scatter.Append(',');
                        scatter.Append('[').Append(Math.Round(obs)).Append(',').Append(Math.Round(pe)).Append(',').Append(Math.Round(pn)).Append(',').Append(c).Append(']');
                        sc++;
                    }
                }
                if (cE.Count >= 12)
                {
                    cE.Sort(); cN.Sort();
                    perCountry.Add("{\"id\":" + c + ",\"name\":" + JsonStr(CountryNames[c].Replace('_', ' ')) + ",\"n\":" + cE.Count +
                        ",\"mdapeEngine\":" + R(Quantile(cE, 0.5), 3) + ",\"mdapeNaive\":" + R(Quantile(cN, 0.5), 3) +
                        ",\"bias\":" + R(cO > 0 ? cEs / cO - 1 : 0, 3) + ",\"obs\":" + Math.Round(cO) + "}");
                }
            }
            apeE.Sort(); apeN.Sort();

            // Drift check: apply the full-overlap factors to 2022-2025 Aqua and compare with Suomi NPP.
            var fFull = FitFactors(tot, nC, Sat.Aqua, Sat.Snpp, Months.Index(2012, 2), Months.Index(2021, 12), k);
            var drift = new StringBuilder();
            bool fd = true;
            for (int y = 2012; y <= 2025; y++)
            {
                double o = 0, p = 0;
                for (int m = 1; m <= 12; m++)
                {
                    int t = Months.Index(y, m);
                    if (y == 2012 && m == 1) continue;
                    for (int c = 0; c < nC; c++) { o += tot[c][t][Sat.Snpp][0] + tot[c][t][Sat.Snpp][1]; p += Predict(tot, fFull, c, t, Sat.Aqua); }
                }
                if (!fd) drift.Append(','); fd = false;
                drift.Append("{\"year\":").Append(y).Append(",\"obs\":").Append(Math.Round(o)).Append(",\"pred\":").Append(Math.Round(p)).Append('}');
            }

            var sb = new StringBuilder();
            sb.Append("{\"train\":\"2012-02..2017-12\",\"test\":\"2018-01..2021-12\",\"minObs\":20,\"pairs\":").Append(apeE.Count)
              .Append(",\"naiveFactor\":").Append(R(naive, 3))
              .Append(",\"engine\":{\"mdape\":").Append(R(Quantile(apeE, 0.5), 3)).Append(",\"p90ape\":").Append(R(Quantile(apeE, 0.9), 3))
              .Append(",\"bias\":").Append(R(sumO > 0 ? sumE / sumO - 1 : 0, 3)).Append(",\"rlog\":").Append(R(Pearson(logO, logE), 3)).Append('}')
              .Append(",\"naive\":{\"mdape\":").Append(R(Quantile(apeN, 0.5), 3)).Append(",\"p90ape\":").Append(R(Quantile(apeN, 0.9), 3))
              .Append(",\"bias\":").Append(R(sumO > 0 ? sumN / sumO - 1 : 0, 3)).Append(",\"rlog\":").Append(R(Pearson(logO, logN), 3)).Append('}')
              .Append(",\"countries\":[").Append(string.Join(",", perCountry)).Append(']')
              .Append(",\"scatter\":[").Append(scatter).Append(']')
              .Append(",\"drift\":[").Append(drift).Append("]}");
            Console.WriteLine("Validation engine MdAPE " + R(Quantile(apeE, 0.5), 3) + " vs naive " + R(Quantile(apeN, 0.5), 3) + " (pairs " + apeE.Count + ")");
            return sb.ToString();
        }

        static string CalendarJson(string id, string name, int nT, double[] H, double[] L, double[] U, double[,] raw, double[][] fA, double[] lo, double[] hi)
        {
            var sb = new StringBuilder();
            sb.Append("{\"id\":").Append(JsonStr(id)).Append(",\"name\":").Append(JsonStr(name.Replace('_', ' '))).Append(",\"t0\":\"2000-11\",\"n\":").Append(nT);
            sb.Append(",\"H\":[").Append(string.Join(",", H.Select(v => R(v, 1)))).Append(']');
            sb.Append(",\"lo\":[").Append(string.Join(",", L.Select(v => R(v, 1)))).Append(']');
            sb.Append(",\"hi\":[").Append(string.Join(",", U.Select(v => R(v, 1)))).Append(']');
            for (int s = 0; s < Sat.Count; s++)
            {
                var row = new string[nT];
                bool any = false;
                for (int t = 0; t < nT; t++) { row[t] = R(raw[s, t], 0); if (raw[s, t] > 0) any = true; }
                if (any) sb.Append(",\"").Append(Sat.Keys[s]).Append("\":[").Append(string.Join(",", row)).Append(']');
            }
            if (fA != null)
            {
                sb.Append(",\"fAqua\":[").Append(string.Join(",", fA.Select(d => "[" + R(d[0], 3) + "," + R(d[1], 3) + "]"))).Append(']');
                sb.Append(",\"uLo\":[").Append(string.Join(",", lo.Select(v => R(v, 3)))).Append(']');
                sb.Append(",\"uHi\":[").Append(string.Join(",", hi.Select(v => R(v, 3)))).Append(']');
            }
            sb.Append('}');
            return sb.ToString();
        }

        static double Quantile(List<double> sorted, double q)
        {
            if (sorted.Count == 0) return double.NaN;
            double pos = (sorted.Count - 1) * q;
            int i = (int)Math.Floor(pos);
            double frac = pos - i;
            if (i + 1 < sorted.Count) return sorted[i] * (1 - frac) + sorted[i + 1] * frac;
            return sorted[i];
        }

        static double Pearson(List<double> a, List<double> b)
        {
            int n = a.Count; if (n < 3) return double.NaN;
            double ma = a.Average(), mb = b.Average(), sab = 0, saa = 0, sbb = 0;
            for (int i = 0; i < n; i++) { double da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
            return sab / Math.Sqrt(saa * sbb);
        }

        static double Clamp(double v, double a, double b) { return v < a ? a : v > b ? b : v; }

        static string R(double v, int d)
        {
            if (double.IsNaN(v) || double.IsInfinity(v)) return "null";
            double r = Math.Round(v, d);
            if (r == 0) return "0";
            return r.ToString(d == 0 ? "0" : "0." + new string('#', d), CultureInfo.InvariantCulture);
        }

        static string JsonStr(string s)
        {
            var sb = new StringBuilder("\"");
            foreach (char ch in s)
            {
                if (ch == '"' || ch == '\\') sb.Append('\\').Append(ch);
                else if (ch < 32) sb.Append("\\u").Append(((int)ch).ToString("x4"));
                else sb.Append(ch);
            }
            return sb.Append('"').ToString();
        }
    }
}
