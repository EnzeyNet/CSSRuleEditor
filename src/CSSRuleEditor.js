(function(angular, CSC) {

	var module = angular.module('net.enzey.service.css.editor', []);

	module.service('nzCssRuleEditor', function($window, $http, $q) {
		// Create a new style sheet to hold custom styles
		angular.element($window.document.head).append( angular.element('<style></style>') );

		// Get last loaded style sheet (the style sheet just added)
		var styleSheet = $window.document.styleSheets[document.styleSheets.length - 1];

		//var cssRuleCode = $window.document.all ? 'rules' : 'cssRules'; //account for IE and FF
		//var styleSetter = $window.document.all ? 'value' : 'style'; //account for IE and FF

		var CssRuleEditor = this;
		var cssRuleCache = {};

		var getJsStyleName = function(styleName) {
			var firstCharacterRegex = new RegExp('^.');
			styleName = styleName.split('-');
			for (var i = 1; i < styleName.length; i++) {
				styleName[i] = styleName[i].replace(firstCharacterRegex, styleName[i][0].toUpperCase());
			}

			return styleName.join('');
		};

		var getStyles = function(cssRule) {
			var styles;
			if (cssRule['value']) {
				styles = cssRule['value'];
			} else {
				styles = cssRule['style'];
			}
			return styles;
		};

		var getCssRules = function(styleSheet) {
			var cssRules;
			if (styleSheet['rules']) {
				cssRules = styleSheet['rules'];
			} else {
				cssRules = styleSheet['cssRules'];
			}
			return cssRules;
		};

		var extractStyles = function(styles) {
			var extractedStyles = {};
			for (var i = 0; i < styles.length; i++) {
				var styleName = getJsStyleName(styles[i]);
				extractedStyles[ styleName ] = styles[ styleName ];
			}
			return extractedStyles;
		};

		var parseStyleSheet = function(styleSheet) {
			var cssRules = getCssRules(styleSheet);

			for (var iRule = 0; iRule < cssRules.length; iRule++) {
				var cssRule = cssRules[iRule];
				if (cssRule instanceof CSSStyleRule) {
					var styles = getStyles(cssRule);
					styles = extractStyles(styles);
					cssRule.selectorText.split(',').forEach(function(selector) {
						selector = selector.replace(new RegExp('^ *'), '');
						selector = selector.replace(new RegExp(' *$'), '');

						if (!allCssRules[selector]) {
							allCssRules[selector] = {};
						}
						angular.extend(allCssRules[selector], styles);
					});
				}
			};
		};

		var cacheStyleSheets = function() {
			var allStyleSheets = $window.document.styleSheets;
			var styleSheetCache = new Array(allStyleSheets.length-1);

			var promises = [];
			for (var i = 0; i < allStyleSheets.length-1; i++) {
				(function () {
					var index = i;
					var currentStyleSheet = allStyleSheets[i];
					var deferred = $q.defer();
					promises.push(deferred.promise);

					try {
						getCssRules(currentStyleSheet);
						styleSheetCache[index] = currentStyleSheet;
						deferred.resolve(currentStyleSheet);
					} catch (e) {
						$http.get(currentStyleSheet.href).success(function(data, status, headers, config) {
							var tempStyle = angular.element("<style></style>");
							tempStyle.html(data);
							angular.element($window.document.head).prepend(tempStyle);

							var allStyleSheets = $window.document.styleSheets;
							var lastStyleSheet = allStyleSheets[0];

							styleSheetCache[index] = lastStyleSheet;

							tempStyle.remove();
							deferred.resolve(lastStyleSheet);
						}).error(function(data, status, headers, config) {
							deferred.reject();
						});
					}
				})()
			}
			var allPromises = $q.all(promises).then(function(foo, bar) {
				return styleSheetCache;
			});

			return allPromises;
		};

		var allCssRules = {};
		var baseStyleSheets = [];

		this.getBaseRules = function() {
			var promise = cacheStyleSheets().then(function(styleSheetCache) {
				baseStyleSheets = styleSheetCache;
				styleSheetCache.forEach(function(styleSheet) {
					parseStyleSheet(styleSheet);
				});
				return angular.extend({}, allCssRules);
			});

			return promise;
		};

		this.getCustomRule = function(ruleName) {
			if (!ruleName) return;

			var cssRule = cssRuleCache[ruleName];
			if (!cssRule) {
				// Rules does not exist
				styleSheet.insertRule(ruleName + ' {}', 0);

				var cssRules = getCssRules(styleSheet);
				cssRuleCache[ruleName] = cssRules[0];
				//cssRuleCache[ruleName] = styleSheet[cssRuleCode][0];
				cssRule = cssRuleCache[ruleName];
			}

			return getStyles(cssRule);
			//return cssRule[styleSetter];
		};

		this.removeCustomRule = function(ruleName) {
			if (!ruleName) return;

			var cssRules = getCssRules(styleSheet);
			for (var i = 0; i < cssRules.length; i++) {
				var cssRule = cssRules[i];
				if (cssRule.selectorText.toLowerCase() === ruleName.toLowerCase()) {
					styleSheet.deleteRule(i);
					cssRuleCache[ruleName] = null;
					delete cssRuleCache[ruleName];
				}
			}
		};

		this.getAllCustomRules = function() {
			return angular.extend({}, cssRuleCache);
		};

		this.removeAllCustomRules = function() {
			Object.keys(cssRuleCache).forEach(function (ruleName){
				CssRuleEditor.removeCustomRule(ruleName);
			});
		};

		var createNumberFromSpecificity = function(specificity) {
			specificity[1] << 20 | specificity[2] << 10 | specificity[3];
		};
		var ruleSspecificityCache = {};
		var getSpecificity = function(rule) {
			var result = ruleSspecificityCache[rule];
			if (!result) {
				var specificity = CSC.calculate(rule)[0].specificity.split(',');
				ruleSspecificityCache[rule] = createNumberFromSpecificity(specificity);
				result = ruleSspecificityCache[rule];
			}

			return result;
		};

		this.getStyles = function(element) {
			var deferred = $q.defer();

			var collectRules = function(rule) {
				var foundElements = $window.document.querySelectorAll(rule);
				for (var i = 0; i < foundElements.length; i++) {
					if (element === foundElements[i]) {
						return rule;
					}
				}
			};
			CssRuleEditor.getBaseRules().then(function(baseRules) {
				var validStyles = [];
				Object.keys(baseRules).map(collectRules).forEach(function(rule) {
					if (!rule) {return;}
					validStyles.push({
						rule: rule,
						styles: baseRules[rule],
					});
				});
				var customRules = CssRuleEditor.getAllCustomRules();
				Object.keys(customRules).map(collectRules).forEach(function(rule) {
					if (!rule) {return;}
					validStyles.push({
						rule: rule,
						styles: extractStyles( getStyles(customRules[rule]) ),
					});
				});

				validStyles.sort(function(a, b){
					return getSpecificity(a.rule) - getSpecificity(b.rule);
				});

				var stylesForElement = {};
				validStyles.forEach(function(styleObj) {
					angular.extend(stylesForElement, styleObj.styles);
				});

				deferred.resolve(stylesForElement)
			});

			return deferred.promise;
		};

	});

})(angular, SPECIFICITY);