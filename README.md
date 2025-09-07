# 🤖 Dumb Shit 2 AI

A playful experiment where AI analyzes its own performance! This project generates school schedules and then introspectively examines how well it performed.

## 🚀 Quick Start

1. **Install dependencies**: `npm install`
2. **Add API key**: Copy `.env.example` to `.env` and add your DeepSeek API key
3. **Start server**: `npm run dev`
4. **Try these endpoints**:

```bash
# Get some class schedules
/api/task/get-class-schedule?class=3a&date=2025/9/5
/api/task/get-class-schedule?class=3a&date=2025/9/4
/api/task/get-class-schedule?class=3a&date=2025/9/3

# Then have AI analyze itself!
/api/task/task-record-analyser?task=get-class-schedule
/api/task/task-api-analyser?task=get-class-schedule
```

## 🎯 What's Cool About This?

- AI generates school schedules from CSV data
- AI then analyzes its own performance
- AI even examines its own code structure

## 📁 Project Structure

```
/tasks-apis          # Task implementations
/tasks_records       # JSON records of AI task executions
/dev - *.csv         # Sample data files
```