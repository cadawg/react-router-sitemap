expect.extend({
	toHaveSameItems(received, expected, strict) {
		const pass = strict
			? received.length === expected.length &&
			  expected.every(item => received.includes(item))
			: expected.every(item => received.includes(item));

		return {
			pass,
			message: () =>
				`expected ${JSON.stringify(received)} to have same items as ${JSON.stringify(expected)}`,
		};
	},
});