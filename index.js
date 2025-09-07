import express from "express";
import fs, { existsSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { pathToFileURL } from "url"; // 添加这个导入

const app = express();
const port = 3000;

process.loadEnvFile();

// 配置中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件目录
app.use(express.static('public'));

const appPath = process.cwd();
const taskRecordsPath = resolve(appPath, "tasks_records");

app.get('/api/task/:type', async (req, res) => {
    const uuid = randomUUID().toString();
    const recordFilePath = resolve(taskRecordsPath, `${uuid}.json`);
    const record = {};
    const metaRecord = {};
    const requestRecord = {};
    const processRecord = {};
    const responseRecord = {};
    const statusRecord = { state: "running" };
    const analytics = { history: [] };
    record.status = statusRecord;
    record.meta = metaRecord;
    record.request = requestRecord;
    record.process = processRecord;
    record.response = responseRecord;
    record.analytics = analytics;

    try {
        const type = req.params.type;
        const params = req.query;
        // 确保目录存在
        if (!existsSync(taskRecordsPath)) {
            fs.mkdirSync(taskRecordsPath, { recursive: true });
        }
        
        if (type == null || params == null) {
            return res.status(400).json({ error: "Missing parameters" });
        }
        metaRecord['task_creation_time'] = Date.now();
        metaRecord['task_id']= uuid;
        metaRecord['task_type']= type;
        requestRecord['type'] = type;
        requestRecord['params'] = params;

        fs.writeFileSync(recordFilePath, JSON.stringify(record));

        const path = resolve(appPath, "tasks-apis", type, "entry.js");
        if (!existsSync(path)) {
            return res.status(500).json({ error: "Module not found" });
        }

        // 使用 pathToFileURL 转换路径
        const moduleUrl = pathToFileURL(path).href;
        const entry = await import(moduleUrl);

        if (entry.default == null) {
            return res.status(500).json({ error: "Invalid module structure" });
        }

        const response = await entry.default(params, processRecord, uuid);

        statusRecord.state = "success";
        record['response'] = response;
        res.json(response);

    } catch (error) {
        console.error("Error:", error);

        statusRecord.state = "fail";
        statusRecord.reason = error.toString();
        res.status(500).json({ error: error.message });
    }

    fs.writeFileSync(recordFilePath, JSON.stringify(record));
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});