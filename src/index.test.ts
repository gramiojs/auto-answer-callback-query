import { describe, expect, it } from "bun:test";
import { TelegramTestEnvironment } from "@gramio/test";
import { Bot } from "gramio";
import { autoAnswerCallbackQuery } from "./index";

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

		const answerCall = env.apiCalls.find(
			(c) => c.method === "answerCallbackQuery",
		);
		expect(answerCall).toBeDefined();
	});

	it("should not auto-answer when handler calls context.answer()", async () => {
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

		const answerCalls = env.apiCalls.filter(
			(c) => c.method === "answerCallbackQuery",
		);
		expect(answerCalls).toHaveLength(1);
	});

	it("should not auto-answer when handler calls context.answerCallbackQuery()", async () => {
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

		const answerCalls = env.apiCalls.filter(
			(c) => c.method === "answerCallbackQuery",
		);
		expect(answerCalls).toHaveLength(1);
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

		const answerCall = env.apiCalls.find(
			(c) => c.method === "answerCallbackQuery",
		);
		expect(answerCall).toBeDefined();
		expect(answerCall?.params.text).toBe("Auto answer");
		expect(answerCall?.params.show_alert).toBe(true);
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

		const answerCall = env.apiCalls.find(
			(c) => c.method === "answerCallbackQuery",
		);
		expect(answerCall).toBeDefined();
	});
});
