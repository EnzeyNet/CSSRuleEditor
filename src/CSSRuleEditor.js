(function(angular, $) {

	var module = angular.module('net.enzey.service.css.editor', []);

	module.service('CssRuleEditor', function($window) {
		// Create a new style sheet to hold custom styles
		$('head').append($('<style><>/style'));

		// Get last loaded style sheet (the style sheet just added)
		var styleSheet = $window.document.styleSheets[document.styleSheets.length - 1];

		var cssRuleCode = $window.document.all ? 'rules' : 'cssRules'; //account for IE and FF
		var styleSetter = $window.document.all ? 'value' : 'style'; //account for IE and FF

		var CssRuleEditor = this;
		var cssRuleCache = {};

		this.getRule = function(ruleName) {
			if (!ruleName) return;

			var cssRule = cssRuleCache[ruleName];
			if (!cssRule) {
				// Rules does not exist
				styleSheet.insertRule(ruleName + ' {}', 0);

				var cssRules;
				if (styleSheet['rules']) {
					cssRules = styleSheet['rules'];
				} else {
					cssRules = styleSheet['cssRules'];
				}
				cssRuleCache[ruleName] = cssRules[0];
				//cssRuleCache[ruleName] = styleSheet[cssRuleCode][0];
				cssRule = cssRuleCache[ruleName];
			}
			var styles;
			if (cssRule['value']) {
				styles = cssRule['value'];
			} else {
				styles = cssRule['style'];
			}
			return styles;
			//return cssRule[styleSetter];
		};

		this.removeRule = function(ruleName) {
			if (!ruleName) return;

			var cssRules = styleSheet[cssRuleCode];
			for (var i = 0; i < cssRules.length; i++) {
				var cssRule = cssRules[i];
				if (cssRule.selectorText.toLowerCase() === ruleName.toLowerCase()) {
					styleSheet.deleteRule(i);
					cssRuleCache[ruleName] = null;
					delete cssRuleCache[ruleName];
				}
			}
		};

		this.getAllRules = function() {
			return $.extend({}, cssRuleCache);
		};

		this.removeAllRules = function() {
			Object.keys(cssRuleCache).forEach(function (ruleName){
				CssRuleEditor.removeRule(ruleName);
			});
		};
	});

})(angular, jQuery);