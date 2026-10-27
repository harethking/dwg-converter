// خادم تحويل DWG إلى DXF
// يستقبل ملف DWG عبر POST /convert ويرجع نص DXF
const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "";
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 25 * 1024 * 1024 } });

// السماح للتطبيق (WebView) بالاتصال بالخادم
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (req, res) => res.send("DWG converter is running"));

app.post("/convert", (req, res) => {
  if (API_KEY && req.get("X-Api-Key") !== API_KEY) {
    return res.status(401).send("unauthorized");
  }

  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).send("upload failed: " + err.message);
    if (!req.file) return res.status(400).send("no file uploaded");

    const inPath = req.file.path;
    const outPath = path.join(os.tmpdir(), crypto.randomUUID() + ".dxf");

    // dwg2dxf من مكتبة LibreDWG
    execFile("dwg2dxf", ["-o", outPath, inPath], { timeout: 60000 }, async (e, stdout, stderr) => {
      try {
        // LibreDWG قد يرجع رمز خطأ مع تحذيرات بسيطة رغم نجاح التحويل، فنعتمد على وجود الملف
        const dxf = await fs.readFile(outPath).catch(() => null);
        if (!dxf || !dxf.length) {
          const msg = (stderr || (e && e.message) || "").toString().slice(0, 500);
          return res.status(422).send("conversion failed: " + msg);
        }
        // نرسل البايتات كما هي حتى لا يتلف النص العربي في الملفات القديمة (ANSI_1256)
        res.type("application/octet-stream").send(dxf);
      } catch (x) {
        res.status(500).send("error: " + x.message);
      } finally {
        fs.unlink(inPath).catch(() => {});
        fs.unlink(outPath).catch(() => {});
      }
    });
  });
});

app.listen(PORT, () => console.log("DWG converter listening on port " + PORT));
