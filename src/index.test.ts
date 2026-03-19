import { describe, expect, it } from "bun:test";
import { TelegramTestEnvironment } from "@gramio/test";
import { Bot } from "gramio";
import { autoAnswerCallbackQuery } from "./index.js";

/** Wait for the plugin's post-handler async middleware to complete */
const tick = () => new Promise((r) => setTimeout(r, 50));

describe("autoAnswerCallbackQuery", () => {
	it("should auto-answer when handler doesn't answer", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("test", (context) => {
				return context.send("Got it");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Alice" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("test");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});

	it("should not double-answer when handler calls context.answer()", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("answered", (context) => {
				return context.answer("Already answered!");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Bob" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("answered");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});

	it("should not double-answer when handler calls context.answerCallbackQuery()", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("direct", (context) => {
				return context.answerCallbackQuery({
					text: "Direct answer",
				});
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Carol" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("direct");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});

	it("should pass custom params to auto-answer", async () => {
		const bot = new Bot("test")
			.extend(
				autoAnswerCallbackQuery({
					text: "Auto answer",
					show_alert: true,
				}),
			)
			.callbackQuery("custom", (context) => {
				return context.send("no answer here");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Dave" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("custom");
		await tick();

		const calls = env.filterApiCalls("answerCallbackQuery");
		expect(calls).toHaveLength(1);
		expect(calls[0].params.text).toBe("Auto answer");
		expect(calls[0].params.show_alert).toBe(true);
	});

	it("should auto-answer with empty params when no config provided", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("noop", () => {});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Eve" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("noop");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});

	// --- Complex handler scenarios ---

	it("should still auto-answer when handler throws", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("throws", () => {
				throw new Error("handler error");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Frank" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("throws");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});

	it("should still auto-answer when async handler rejects", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("rejects", async () => {
				await Promise.resolve();
				throw new Error("async rejection");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Grace" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("rejects");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});

	it("should preserve show_alert:true when handler answers with it", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("alert", (context) => {
				return context.answer({
					text: "Important!",
					show_alert: true,
				});
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Helen" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("alert");
		await tick();

		const calls = env.filterApiCalls("answerCallbackQuery");
		expect(calls).toHaveLength(1);
		expect(calls[0].params.show_alert).toBe(true);
		expect(calls[0].params.text).toBe("Important!");
	});

	it("should preserve show_alert when handler uses answerCallbackQuery", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("alert-direct", (context) => {
				return context.answerCallbackQuery({
					text: "Direct alert!",
					show_alert: true,
				});
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Ivan" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("alert-direct");
		await tick();

		const calls = env.filterApiCalls("answerCallbackQuery");
		expect(calls).toHaveLength(1);
		expect(calls[0].params.show_alert).toBe(true);
		expect(calls[0].params.text).toBe("Direct alert!");
	});

	it("should handle async work before answer", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("async-work", async (context) => {
				await new Promise((r) => setTimeout(r, 10));
				await context.send("processing done");
				await context.answer({ text: "Done!", show_alert: true });
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Jack" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("async-work");
		await tick();

		const calls = env.filterApiCalls("answerCallbackQuery");
		expect(calls).toHaveLength(1);
		expect(calls[0].params.text).toBe("Done!");
		expect(calls[0].params.show_alert).toBe(true);
	});

	it("should auto-answer when handler throws AFTER async work (before answering)", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery({ text: "Fallback" }))
			.callbackQuery("throw-after-work", async (context) => {
				await context.send("started");
				throw new Error("oops");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Kate" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("throw-after-work");
		await tick();

		const calls = env.filterApiCalls("answerCallbackQuery");
		expect(calls).toHaveLength(1);
		expect(calls[0].params.text).toBe("Fallback");
	});

	it("should handle answer with string shortcut", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("string-answer", (context) => {
				return context.answer("Short text");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Leo" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("string-answer");
		await tick();

		const calls = env.filterApiCalls("answerCallbackQuery");
		expect(calls).toHaveLength(1);
		expect(calls[0].params.text).toBe("Short text");
	});

	it("should handle multiple callbackQuery handlers (only matching one answers)", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("action:1", (context) => {
				return context.answer("Action 1");
			})
			.callbackQuery("action:2", (context) => {
				return context.send("Action 2 — no answer");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Mike" });

		const msg = await user.sendMessage("click me");

		env.clearApiCalls();
		await user.on(msg).click("action:1");
		await tick();

		const calls1 = env.filterApiCalls("answerCallbackQuery");
		expect(calls1).toHaveLength(1);
		expect(calls1[0].params.text).toBe("Action 1");

		env.clearApiCalls();
		await user.on(msg).click("action:2");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});

	it("should auto-answer when no handler matches the callback data", async () => {
		const bot = new Bot("test")
			.extend(autoAnswerCallbackQuery())
			.callbackQuery("known", (context) => {
				return context.answer("Known");
			});

		const env = new TelegramTestEnvironment(bot);
		const user = env.createUser({ first_name: "Nick" });

		const msg = await user.sendMessage("click me");
		env.clearApiCalls();

		await user.on(msg).click("unknown-data");
		await tick();

		expect(env.filterApiCalls("answerCallbackQuery")).toHaveLength(1);
	});
});
