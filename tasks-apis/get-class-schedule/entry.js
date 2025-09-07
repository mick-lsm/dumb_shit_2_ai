import fs from "fs";
import openai from "openai";

export default async function execute(params, record, id) {
    const date = params.date;
    const _class = params.class;

    const client = new openai({
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.APIKEY
    });

    const school_schedule = fs.readFileSync('./dev - school_schedule.csv').toLocaleString();
    const _3a_class_schedule = fs.readFileSync('./dev - 3a_schedule.csv').toLocaleString();
    const times = fs.readFileSync('./dev - times.csv').toLocaleString();

    const message = JSON.stringify({
        "task": "Integrate the materials provided and give the class schedule. Parse Lesson {number} to actual lessons",
        "response_format": "json_object",
        "request_info": {
            date: date,
            class: _class,
            weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(date).getDay()],
            lang: "Traditional Chinese",

        },
        "descriptions": fs.readFileSync('./tasks-apis/get-class-schedule/descriptions.json').toString(),
        "reply_format": fs.readFileSync('./tasks-apis/get-class-schedule/reply_format.json').toString(),
        "school_schedule": school_schedule,
        "3a_class_schedule": _3a_class_schedule,
        "times": times
    });
    record['message'] = message;

    const completion = await client.chat.completions.create({
        messages: [{
            role: "system", content: message
        }],
        model: "deepseek-chat",
        response_format: {
            type: "json_object"
        }
    });

    const response = JSON.parse(completion.choices[0].message.content);

    record["response"] = response;
    return response;
}