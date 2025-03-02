/**
 * ComponentEffect is a class that can extend the script element, that allows developers
 * to build side-effects for web-components.
 *
 * {@link https://tram-one.io/tram-lite/#tl-effect}
 */
class ComponentEffect {
	/**
	 * function to trigger the javascript in a script tag.
	 * This does not handle the src attribute, only inline javascript.
	 * The `this` keyword will reference the host parent node of this script tag.
	 * @param {HTMLScriptElement} scriptTag
	 */
	static processScriptTag(scriptTag) {
		// don't do this if we have a hold on the script tag
		if (scriptTag.hasAttribute('tl-hold')) {
			return;
		}

		const hostElement = scriptTag.getRootNode().host;

		// provide a scoped evaluation of the script tags in this element
		const scopedEval = (script) => {
			return Function('document', 'window', script).bind(hostElement)(hostElement.shadowRoot, window);
		};

		scopedEval(scriptTag.innerHTML);
	}

	/**
	 * connect function for ComponentEffect - when this is run on a script,
	 *   we trigger that script with the host element as context, and set up an
	 *   observer if a set of dependencies are defined and ever update
	 * @param {HTMLScriptElement} newNode
	 */
	static connect(newNode) {
		const hostElement = newNode.getRootNode().host;

		// run an initial run of the script
		// (this won't happen if there is a tl-hold on the script)
		ComponentEffect.processScriptTag(newNode);

		// if we have any dependencies, add a listener to trigger them
		if (newNode.hasAttribute('tl-dependencies') && newNode.hasSetupListener !== true) {
			const dependencyString = newNode.getAttribute('tl-dependencies');
			const dependencies = dependencyString.split(' ');

			TramLite.addAttributeListener(hostElement, dependencies, () => {
				// check if the inline script is being held
				ComponentEffect.processScriptTag(newNode);
			});
			newNode.hasSetupListener = true;
		}

		// if we ever set (or remove) the hold on this, trigger the inline script
		// (this allows developers to delay triggering inline scripts)
		TramLite.addAttributeListener(newNode, ['tl-hold'], () => {
			ComponentEffect.processScriptTag(newNode);
		});
	}
}

if (MODULE === true) {
	// if module is available, export this class
	if (typeof module !== 'undefined') {
		module.exports.ComponentEffect = ComponentEffect;
	}
}
if (INSTALL === true) {
	// setup shadow root processor so that tl-effects that are added are processed correctly
	TramLite.appendShadowRootProcessor('[tl-effect]', ComponentEffect);
}
