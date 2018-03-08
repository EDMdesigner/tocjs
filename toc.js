function toc(element) {
	if (!element) {
		return;
	}

	var elements;

	if (element instanceof Array) {
		elements = element;
	} else {
		elements = [element];
	}

	var hElements = [];
	for (var idx = 0; idx < elements.length; idx += 1) {
		var act = elements[idx];

		var actHeadings = act.querySelectorAll("h1, h2, h3, h4, h5, h6");

		for (var actIdx = 0; actIdx < actHeadings.length; actIdx += 1) {
			hElements.push(actHeadings[actIdx]);
		}
	}

	//check doc heading structure

	if (!hElements.length) {
		throw new Error("Heading elements were not found.");
	}

	if (hElements[0].tagName !== "H1") {
		throw new Error("The first heading in the document should be an H1.");
	}

	var allowedTagNames = ["H1", "H2", "H3", "H4", "H5", "H6"];


	var lastDepth = 0;
	var root = {
		element: hElements[0],
		depth: 0,
		children: []
	};
	var lastDescriptor = root;

	for (var idx = 1; idx < hElements.length; idx += 1) {
		var act = hElements[idx];

		var actDepth = allowedTagNames.indexOf(act.tagName);

		if (actDepth === 0) {
			throw new Error("There should be only one H1 element in a HTML document.");
		}

		if (actDepth < 0) {
			throw new Error("Invalid tagName", act);
		}

		var depthDiff = actDepth - lastDepth;

		if (depthDiff > 1) {
			throw new Error("The heading structure of your document contains an error. There should not be a " + act.tagName + " after " + hElements[idx - 1].tagName + ".", act);
		}

		var actDescriptor = {
			element: act,
			depth: actDepth,
			children: []
		};

		setParent(actDescriptor);

		lastDepth = actDepth;
		lastDescriptor = actDescriptor;
	}

	function setParent(elementDescriptor) {
		var parentDescriptor = lastDescriptor;

		while (parentDescriptor.depth !== elementDescriptor.depth - 1) {
			parentDescriptor = parentDescriptor.parent;
		}

		elementDescriptor.parent = parentDescriptor;
		parentDescriptor.children.push(elementDescriptor);
	}


	function logTree(elementDescriptor) {
		console.log(elementDescriptor.depth, elementDescriptor.element);

		elementDescriptor.children.forEach(logTree);
	}

	//logTree(root);

	var nextIdIdx = 0;
	function createList(elementDescriptor) {
		if (!elementDescriptor.element.id) {
			elementDescriptor.element.id = "toc_heading_id_" + nextIdIdx;
			nextIdIdx += 1;
		}

		var li = document.createElement("li");

		var link = document.createElement("a");
		link.href = "#" + elementDescriptor.element.id;
		var text = document.createTextNode(elementDescriptor.element.innerText);
		link.appendChild(text);

		elementDescriptor.link = link;

		li.appendChild(link);

		if (elementDescriptor.children.length > 0) {
			var ul = document.createElement("ul");
			li.appendChild(ul);
			elementDescriptor.children.forEach(function(actChild) {
				ul.appendChild(createList(actChild));
			});
		}

		return li;
	}

	var tocUl = document.createElement("ul");
	tocUl.appendChild(createList(root));

	var activeElement = root;
	activeElement.link.className = "active";

	function setActiveFlag(elementDescriptor) {
		var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
		var clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
		var closest = 1e5;
		function getActive(elementDescriptor) {
			var bBox = elementDescriptor.element.getBoundingClientRect();
			console.log(elementDescriptor.element, bBox.top);
			if (Math.abs(bBox.top) < Math.abs(closest)) {
				closest = bBox.top;
			}
			elementDescriptor.children.forEach(getActive);
			
		}
		getActive(root);
		console.log(closest);
		
		function setActive (elementDescriptor) {
			var bBox = elementDescriptor.element.getBoundingClientRect();
			if (bBox.top === closest)  {	
				activeElement.link.className = "";
				activeElement = elementDescriptor;
				activeElement.link.className = "active";
				console.log(activeElement.element);
				return;
			}
			elementDescriptor.children.forEach(setActive);
		}
		setActive(root);
		
	}
		

	addEventListener("scroll", function() {
		setActiveFlag(root);
	});

	return tocUl;
}