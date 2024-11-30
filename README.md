# Auto answer callback query

[![npm](https://img.shields.io/npm/v/@gramio/auto-answer-callback-query?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/@gramio/auto-answer-callback-query)
[![JSR](https://jsr.io/badges/@gramio/auto-answer-callback-query)](https://jsr.io/@gramio/auto-answer-callback-query)
[![JSR Score](https://jsr.io/badges/@gramio/auto-answer-callback-query/score)](https://jsr.io/@gramio/auto-answer-callback-query)

This plugin auto answer on `callback_query` events with `answerCallbackQuery` method if you haven't done it yet.

```ts
import { Bot, InlineKeyboard } from "gramio";
import { autoAnswerCallbackQuery } from "@gramio/auto-answer-callback-query";

const bot = new Bot(process.env.BOT_TOKEN as string)
    .extend(autoAnswerCallbackQuery())
    .command("start", (context) =>
        context.send("Hello!", {
            reply_markup: new InlineKeyboard()
                .text("test", "test")
                .text("test2", "test2"),
        })
    )
    .callbackQuery("test", () => {
        return context.send("Hii"); // The plugin will call an answerCallbackQuery method since you didn't do it
    })
    .callbackQuery("test2", (context) => {
        return context.answer("HII"); // you already answered so plugin won't try to answer
    });
```
