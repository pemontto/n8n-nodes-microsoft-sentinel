const defaultLogger = {
	info() {},
};

function getNestedValue(source, path) {
	return path.split('.').reduce((value, key) => {
		if (value && typeof value === 'object' && key in value) {
			return value[key];
		}
		return undefined;
	}, source);
}

function createExecuteContext(params = {}) {
	return {
		getNodeParameter(path, defaultValue) {
			const value = getNestedValue(params, path);
			return value === undefined ? defaultValue : value;
		},
		getNode() {
			return { type: 'testNode', name: 'Test Node' };
		},
		getItemIndex() {
			return 0;
		},
		logger: defaultLogger,
	};
}

module.exports = {
	createExecuteContext,
};
