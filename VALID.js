/* Module - VALID.js;
	Validate form input.
	Version: 2.1.4      
*/
var VALID = (function (V, d) {
	"use strict";

	// SETTINGS ------------------------------------------------------- |
	V.settings = {
		// Manual suffixes [Default:false]
		MANUAL_SUFFIXES: false,
		M_SUFFIXES: "name|lastname|company|email",
		// Default message [Default:'Vissa fÃƒÂ¤lt ÃƒÂ¤r tomma!']
		MSG_DEFAULT: "Vissa fÃƒÂ¤lt ÃƒÂ¤r tomma!",
		// Preload display [Default:true]
		DISPLAY_PRELOAD: true
	};

		/* Validation functions */
	var	VALIDfunction = {
			noSpaces: function (element, callback) {  // Remove all spaces inside.
				var bool;
				element.value = element.value.replace(/\s/g, '');
				bool = (element.value.length > 0) ? true : false;
				return callback ? callback() : bool;
			},
			notEmpty: function (element, callback) {  // Check if input is empty.
				var bool;
				bool = (!element.value || element.value.length < 1) ? false : bool = true;
				return callback ? callback() : bool;
			},
			isEmail: function (element, callback) {  // Simple check if input is email.
				var bool = /^[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-.]+$/.test(element.value);
				return callback ? callback() : bool;
			},
			onlyDigits: function (element, replace, callback) { // Check for digits.
				var bool = /^\d[\d]*\d$/.test(element.value);
				return callback ? callback() : bool;
			},
			onlyDigits_spaces: function (element, replace, callback) { // Check for digits, allow spaces.
				var bool = /^\d[\d ]*\d$/.test(element.value);
				return callback ? callback() : bool;
			},
			trimSpaces: function (element, replace, callback) {  // Removes spaces infront and behind input.
				var bool;
				element.value = element.value.replace(/^\s+|\s+$/g, '');
				bool = (element.value.length > 0) ? true : false;
				return callback ? callback() : bool;
			}
		},
		/* Class names */
		VALIDclass = {
			name: {
				func: ['notEmpty', 'trimSpaces'],
				callback: [],
				message: ["Fyll i namn"]
			},
			lastname: {
				func: ['notEmpty', 'trimSpaces'],
				callback: [],
				message: ["Fyll i efternamn"]
			},
			company: {
				func: ['notEmpty', 'trimSpaces'],
				callback: [],
				message: ["Fyll i f&ouml;retag"]
			},
			email: {
				func: ['notEmpty', 'noSpaces', 'isEmail'],
				callback: [],
				message: ["Fyll i e-post", "Fyll i en korrekt e-post"]
			}, 
			phone: {
				func: ['notEmpty', 'onlyDigits_spaces'],
				callback: [],
				message: ["Fyll i telefonnummer"]
			},
			address: {
				func: ['notEmpty', 'trimSpaces'],
				callback: [],
				message: ["Fyll i adress"]
			},
			zipcode: {
				func: ['notEmpty', 'trimSpaces'],
				callback: [],
				message: ["Fyll i postnummer"]
			},
			estate: {
				func: ['notEmpty', 'trimSpaces'],
				callback: [],
				message: ["Fyll i fastighetsbeteckning"]
			}
		},
		/* Setup Variables */
		counter = 0, // ID generation
		cache = [],
		run = false,
		display = (V.settings.DISPLAY_PRELOAD ? create_display() : undefined),
		suffixes = (V.settings.MANUAL_SUFFIXES ? V.settings.M_SUFFIXES : getSuffixes()),
		classTestSuffix = new RegExp("(^|\\s+)VALID(" + suffixes + ")(\\s+|$)"),
		classMatchName = new RegExp(/VALID([A-Za-z0-9_]\S\w*)/),
		preventDebug = false,
		validationBool = true;				// Default true.

	// Function - validate_form(form element);
	// Main function.
	V.validate_form = function (e, f, validObj, callback) {
		// Stop form submit for validation...
		var event = e || window.event;
		if (event.preventDefault) {
			event.preventDefault();
		} else {
			event.returnValue = false;
			preventDebug = true;
		}

		console.log(validObj + " " + callback);

		// Variables.
		var form_id = f.id,
			response = false,
			validHolder = undefined;
		
		// Form have an ID?
		// Else set one to it.
		if (!form_id) {
			f.id = form_id = "VALID_" + (counter += 1);
		}

		// Override VALIDclass with supplied object.
		if (validObj !== undefined) {
			alert("not good");
			validHolder = VALIDclass;
			VALIDclass = validObj;
		}

		// Run validation, returns true or false.
		function run () {
			// Has the form been Cached? (effective if it's a big form).
			// Else create Cache and make sure it did.
			if (!cache[form_id]) {
				if (!create_cache(f, form_id)) {
					return false;
				}
			}

			// Validate the Cached form...
			// Return if false.
			if (!validate_cache(f, form_id)) {
				return false;
			}

			return true;
		}
		response = run();

		// Reset VALIDclass if neccesary;
		if (validHolder) {
			VALIDclass = validHolder;
		}

		// If validation fails, run callback.
		if (!response) {
			if (callback) {
				callback();
			}
			return false;
		}

		// If preventDefault() isn't defined, preventDebug is true && if validationBool is false.
		// Run return false before submit triggers.
		if (preventDebug && validationBool === false) {
			return false;
		}

		// Submit form
		f.submit();
	};

	// Function - validate_cache(f, fid)
	// This is where the validation takes place.
	function validate_cache (f, fid) {
		// Variables.
		var element,
			form = cache[fid],
			VALID_func,
			VALID_message,
			msg_fragment = d.createDocumentFragment(),
			responseElement,
			VALIDcontainer,
			successMessage,
			len = form.length, msg, i, j, max, success = true;

		// Looping through the elements of form.
		for (i = 0; i < len; i += 1) {
			// Set Variables...
			element = form[i].element;

			// Fetch corresponding VALIDclass object properties.
			VALID_func = VALIDclass[form[i].name].func;
			VALID_message = VALIDclass[form[i].name].message;

			// Validation...
			// VALID_func is defined?
			if (VALID_func && VALID_func !== '') {

				// For each function in VALID_func;
				for (j = 0, max = VALID_func.length; j < max; j += 1) {

					// If VALIDfunction [[name of function]] (element) is false; (Failed validation)...
					// ValidationBool is false...
					// Add an error message.
					validationBool = VALIDfunction[VALID_func[j]](element);
					console.log(element + ' ' + VALIDfunction[VALID_func[j]](element) + ' ');
					if (validationBool === false) {
						success = false;
						// Fetch message...
						// If VALID_message[0] is empty, fallback on DEFAULT_MSG.
						msg = (VALID_message[0] === undefined ? V.settings.MSG_DEFAULT : VALID_message[j]);
						// If VALID_message[j] (Corresponding to func[j]) is undefined or empty...
						while (msg === undefined || msg === "") {
							msg = VALID_message[j--];
						}

						// Create validation message.
						responseElement = d.createElement("span");
						responseElement.innerHTML += msg;

						// Set CSS.
						element.className += " VALIDborder_failed";
						responseElement.className += " VALIDmessage_error"; 

						// Append error to msg_container.
						msg_fragment.appendChild(responseElement);
						
						// Avoid displaying aditional error for same element.
						break;

					// If VALIDfunction [[name of function]] (element) is true; (Succeded with validation)...
					} else {
						
						if (element.className.indexOf("VALIDborder_failed") !== -1) {
							element.className = "VALIDborder_success feedback_rightcolumn";
						}

					}

				}

			// VALID_func not defined...
			} else {
				return false;
			}

		}

		// If PRELOAD_DISPLAY is false...
		if (!display) {
			display = create_display();
			f.insertBefore(display, f.children[0]);
		}

		// If msg_fragment contains content === validation has failed.
		// Return false.
		if (success === false) {
			d.getElementById("VALIDmsg-container").innerHTML = "";
			d.getElementById("VALIDmsg-container").appendChild(msg_fragment);

			return false;
		}

		// If validation was positive.
		// Check for #VALIDcontainer.
		// Create and append a success message.
		if ( (VALIDcontainer = d.getElementById("VALIDcontainer")) ) {
			successMessage = d.createElement("span");
			successMessage.className += " VALIDheader_success";
			successMessage.appendChild(d.createTextNode("Valideringen godkÃ¤nd!"));
			VALIDcontainer.innerHTML = "";
			VALIDcontainer.appendChild(successMessage);
			VALIDcontainer.className = "VALIDcontainer_success";
		}

		// Validation was a success.
		return true;
	}

	// Function - create_cache(f, fid);
	// Create a Cache of the form saving all the inputs who have a valid "VALIDclass"-classname.
	function create_cache (f, fid) {
		// Variables.
		var array = [],
			element,
			classnames,
			valid_classname, 
			len = f.length, i;

		// Loop through elements of the form.
		// Check for a VALIDclassname.
		// Saves the first VALIDclass found (separated from the namespace) and the element
		//  as ({name:className,element:element} in array[]).
		for (i = 0; i < len; i += 1) {
			element = f[i];
			classnames = element.className;
			
			if (classnames && classTestSuffix.test(classnames)) { 
				valid_classname = classnames.match(classMatchName);

				if (valid_classname) {
					array.push({
						name: (valid_classname[1]),
						element: element
					});
				}

				valid_classname = null;
			}
		}

		// If array is undefined...
		// Return false.
		if (!array) {
			return false;
		}

		// If DISPLAY_PRELOAD is true... 
		if (display) {
			f.insertBefore(display, f.children[0]);
		}

		// Cache the form with its ID as key.
		// Return true.
		cache[fid] = array;
		return true;
	}

	// Function - create_display()
	// Creates the validation message.
	function create_display () {
		// Variables...
		// Create a <div> container.
		var fragment = d.createDocumentFragment(),
			element = d.createElement("div");

		element.setAttribute("id", "VALIDcontainer");
		element.className = "VALIDcontainer_failed";

		// Append it.
		fragment.appendChild(element);

		// Create a header for the messages.
		element = d.createElement("span");
		element.className += " VALIDheader_failed";
		element.innerHTML += "Valideringen misslyckades!";

		// Append it to the <div> previously created.
		fragment.firstChild.appendChild(element);

		// Create another <div> as a container for the messages.
		element = d.createElement("div");
		element.setAttribute("id", "VALIDmsg-container");

		// Append it below the header.
		fragment.childNodes[0].appendChild(element);

		// Return fragment.
		return fragment;
	}

	// Function - getSuffixes()
	// Returns a string with the VALIDclass-names separated with |.
	function getSuffixes () {
		// If {VALIDclass} is undefined...
		// Return false.
		if (!VALIDclass) {
			return false;
		}

		// Variables.
		var suffixes = "", key;

		// Extract all active VALIDclasses.
		for (key in VALIDclass) {
		   if (VALIDclass.hasOwnProperty(key)) {
		      suffixes += key + "|";
		   }
		}

		// Strip string of the last added "|".
		// Return the VALIDclasses.
		return suffixes.slice(0, -1);
	}
	
	// Return Module
	return V;
}(VALID || {}, document));
