import applyValues from './values-applier';

const replaceParams = (paths = [], params = [], rule = {}) => {
	return params.reduce((currentPaths, param) => {
		return applyValues(currentPaths, param, rule[param]);
	}, paths);
};

export default replaceParams;
