/**
 * @module
 *
 * Auto answer callback query plugin for GramIO
 */
import {
	type APIMethods,
	type AnswerCallbackQueryParams,
	Plugin,
} from "gramio";

/**
 *	This plugin auto answer on `callback_query` events with `answerCallbackQuery` method if you haven't done it yet.
 *
 * 	@example
 * ```ts
 * import { Bot, InlineKeyboard } from "gramio";
 * import { autoAnswerCallbackQuery } from "@gramio/auto-answer-callback-query";
 *
 * const bot = new Bot(process.env.BOT_TOKEN as string)
 * 	.extend(autoAnswerCallbackQuery())
 * 	.command("start", (context) =>
 * 		context.send("Hello!", {
 * 			reply_markup: new InlineKeyboard()
 * 				.text("test", "test")
 * 				.text("test2", "test2"),
 * 		}),
 * 	)
 * 	.callbackQuery("test", () => {
 * 	    return context.send("Hii"); // The plugin will call an answerCallbackQuery method since you didn't do it
 * 	})
 * 	.callbackQuery("test2", (context) => {
 * 	    return context.answer("HII"); // you already answered so plugin won't try to answer
 * 	});
 *
 * ```
 *
 * @param params Params object for {@link APIMethods.answerCallbackQuery | answerCallbackQuery} method
 */
export function autoAnswerCallbackQuery(
	params?: Partial<AnswerCallbackQueryParams>,
): Plugin {
	return new Plugin("@gramio/auto-answer-callback-query").on(
		"callback_query",
		async (context, next) => {
			let isAnswered = false;

			const originalAnswerCallbackQuery = context.answerCallbackQuery;
			context.answerCallbackQuery = async (
				params: AnswerCallbackQueryParams,
			) => {
				isAnswered = true;
				return originalAnswerCallbackQuery.apply(context, [params]);
			};

			await next();
			if (!isAnswered)
				return context.answerCallbackQuery(params).catch(() => {});
		},
	);
}
