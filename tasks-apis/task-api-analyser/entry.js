import OpenAI from "openai";
import fs, { existsSync } from "fs";
import { resolve } from "path";

export default async function execute(params, record, id) {
    const taskType = params.task;

    const apiPath = resolve(process.cwd(), "tasks-apis", taskType);
    const analyticsFilePath = resolve(apiPath, "analytics.json");
    if (!existsSync(apiPath)) throw new Error("InvalidParameterError: task type not exists");
    const apiDir = fs.readdirSync(apiPath);
    const apiInfo = {};
    apiInfo['files'] = apiDir.map(f => {
        const path = resolve(process.cwd(), "tasks-apis", taskType, f);
        const content = fs.readFileSync(path).toLocaleString();
        return { path: path, content: content };
    });

    const taskRecordsPath = resolve(process.cwd(), "tasks_records");
    const recordsDir = fs.readdirSync(taskRecordsPath);
    const recordsFiles = recordsDir.map(f => {
        const path = resolve(process.cwd(), "tasks_records", f);
        const content = JSON.parse(fs.readFileSync(path).toLocaleString());
        return { path: path, content: content }
    }).filter(f => f.content.meta.task_type == taskType || f.content.meta.task_id == id);
    const recordsAnalytics = recordsFiles.map(f => {
        return {
            path: f.path,
            analytics: f.content.analytics[f.content.analytics.length - 1]
        }
    });

    const taskAPIFilesInfo = JSON.stringify(apiInfo);
    const analyticsSumUp = JSON.stringify(recordsAnalytics);

    const client = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.APIKEY
    });

    const message = JSON.stringify({
        "task": "Analyse the task api",
        "task_records_analytics_history": analyticsSumUp,
        "task_api_files_info": taskAPIFilesInfo,
        "reply_format": fs.readFileSync('./tasks-apis/task-api-analyser/reply_format.json')
    });
    
    record["message"] = message;
    const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
            {
                role: "system",
                content: message
            }
        ],
        response_format: {
            type: "json_object"
        }
    });
    const response = JSON.parse(completion.choices[0].message.content);
    if (!existsSync(analyticsFilePath)) {
        fs.writeFileSync(analyticsFilePath, JSON.stringify({
            history: []
        }))
    }
    const recordFile = fs.readFileSync(analyticsFilePath).toLocaleString();
    const recordJSON = JSON.parse(recordFile);
    if (recordJSON['history'] == null) {
        recordJSON['history'] = [];
    }
    response['analytics_creation_time'] = Date.now();
    recordJSON.history.push(response);
    fs.writeFileSync(analyticsFilePath, JSON.stringify(recordJSON));
    return {
        "analyzed_files":recordsFiles.map(f => f.path),
        "response":response
    }
}