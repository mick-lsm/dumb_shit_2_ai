import OpenAI from "openai";
import fs, { existsSync } from "fs";
import { resolve } from "path";

export default async function execute(params, record, id) {
    const taskType = params.task;

    const apiPath = resolve(process.cwd(), "tasks-apis", taskType);
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
        return { path: path, content:  content}
    }).filter(f => f.content.meta.task_type == taskType || f.content.meta.task_id == id);


    const client = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.APIKEY
    });
    const taskAPIFilesInfo = JSON.stringify(apiInfo);
    for (const f of recordsFiles) {
        const message = JSON.stringify({
            "task": "Analyse the Task Record with the Task API Files",
            "response_format": "json_object",
            "request_info": {
                task_api_files_info: taskAPIFilesInfo,
                task_record: f.content
            },
            "description": fs.readFileSync('./tasks-apis/task-record-analyser/description.json').toString(),
            "reply_format": fs.readFileSync('./tasks-apis/task-record-analyser/reply_format.json').toString()
        });

        const completion = await client.chat.completions.create({
            messages: [{
                role: "system", content: message
            }],
            model: "deepseek-chat",
            response_format: {
                type: "json_object"
            }
        })
        const response = JSON.parse(completion.choices[0].message.content);
        const recordFile = fs.readFileSync(f.path).toLocaleString();
        const recordJSON = JSON.parse(recordFile);
        response['analytics_creation_time']= Date.now();
        recordJSON.analytics.history.push(response);
        fs.writeFileSync(f.path, JSON.stringify(recordJSON));
    }
    return {
        "analyzed_files": recordsFiles.map(f => f.path).concat(apiInfo.files.map(f => f.path))
    }
}