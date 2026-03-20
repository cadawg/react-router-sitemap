export default (baseRoute = '', route = '') => {
	return (
		`/${baseRoute}/${route}`
			.replace(/\/+/g, '/')
			.replace(/^.*?|\/$/g, '')
	);
};
