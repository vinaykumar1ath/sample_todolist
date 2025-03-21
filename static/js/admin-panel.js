// Schema and configuration for collections, fields, and condition/update parsers
const taskguide = {
  _id: ["ID", "text", "object"],
  task: ["Task", "text", "string"],
  username: ["User Name", "text", "string"],
  description: ["Description", "text", "string"],
  startDate: ["Start Date&Time", "datetime-local", "date"],
  finishDate: ["Finish Date&Time", "datetime-local", "date"],
  completed: ["Completion Status", "boolean", "boolean"],
  createdAt: ["Record Creation Date&Time", "datetime-local", "date"],
  updatedAt: ["Last Updated Date&Time", "datetime-local", "date"]
};

const userguide = {
  _id: ["ID", "text", "object"],
  username: ["User Name", "text", "string"],
  password: ["password Hashed", "text", "string"],
  createdAt: ["Record Creation Date&Time", "datetime-local", "date"],
  updatedAt: ["Last Updated Date&Time", "datetime-local", "date"]
};

const ConditionParser = {
  "equal": "",
  "notEqual": "",
  "greaterThan": "",
  "greaterThanOrEqual": "",
  "lessThan": "",
  "lessThanOrEqual": "",
  "existsTrueOrFalse": "boolean",
  "regularExp": "string",
  "type": "string",
  "size": "number"
};

const UpdateParser = {
  "set": "",
  "insert": "",
  "unset": "",
  "increment": "number",
  "decrement": "number",
  "multiply": "number",
  "rename": "string",
  "addTimeIn_ms": "number"
};

const collections = {
  "users": userguide,
  "userarchives": userguide,
  "tasks": taskguide,
  "taskarchives": taskguide
};

let selectedCollection = "";
let fields = [];

const preventDefaultEvent = function(event) {
    event.preventDefault(); 
  };

document.addEventListener("DOMContentLoaded", () => {
  loadCollectionOptions();

  // Add event listeners for dynamic loading after DOM content is loaded
  const collectionSelect = document.getElementById("collection");
  const modeSelect = document.getElementById("mode");
  const primaryFilterButton = document.querySelector(".primary-filter button");
  const updateButton = document.querySelector(".update button");

  if (collectionSelect) {
    collectionSelect.addEventListener("change", handleCollectionChange);
  }

  if (modeSelect) {
    modeSelect.addEventListener("change", loadModeButtons);
  }

  if (primaryFilterButton) {
    primaryFilterButton.addEventListener("click", addFilter);
  }

  if (updateButton) {
    updateButton.addEventListener("click", addUpdate);
  }
});

// Function to reset all dynamically loaded data
function resetQueryingAndEditingDynamics() {
  document.querySelectorAll('.primary-filter-dynamic-loader, .secondary-filter-unique, .query-customisations-fields, .update-dynamic-loader ').forEach(div => {
    div.innerHTML = "";
  });

  // Reset Mode and Buttons
  document.getElementById('mode').value = "Default Mode";
  loadModeButtons();
  // const buttonsDiv = document.querySelector(".database-interaction-buttons");
  // buttonsDiv.innerHTML = "";
}

// Function to handle Collection change
function handleCollectionChange(event) {
  selectedCollection = event.target.value;
  fields = Object.keys(collections[selectedCollection] || {});

  resetQueryingAndEditingDynamics();  // Reset everything
  
   updateSelectedFieldList.clear(); 
   updateSelectedFieldList.add("_id");
   filterSelectedFieldList.clear();
   filterSelectedFieldList.add("_id");
  loadUniqueOptions();  // Load unique options
  loadFieldsOptions();  // Load fields in query customisations

  // Load mode selector buttons
  loadModeButtons();
}

function loadUniqueOptions() {
  const uniqueSelect = document.getElementById("secondary-filter-unique");
  if (!uniqueSelect) {
    console.error('Unique select element not found!');
    return;
  }

  uniqueSelect.innerHTML = `<option value="">Select Unique Option</option>`; // Reset the options

  // Populate unique options with the fields from the selected collection
  fields.forEach(field => {
	if(field!=="_id")
    uniqueSelect.innerHTML += `<option value="${field}">${collections[selectedCollection][field][0]}</option>`;
  });
  
  const container = document.getElementById('query-customisations-fields');
      fields.forEach(option => {
        // Create a div for each checkbox
        const checkboxWrapper = document.createElement('div');
        
        // Create checkbox input
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = option;
        checkbox.value = option;
        
        // Create label for checkbox
        const label = document.createElement('label');
        label.setAttribute('for', option);
        label.textContent = collections[selectedCollection][option][0];
        
        // Append checkbox and label to the wrapper
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        
        // Append wrapper to the container
		if(option!== "_id")
        container.appendChild(checkboxWrapper);
      });
  
}

function loadFieldsOptions() {
  const sortFieldSelect = document.getElementById("sort-field");
  if (!sortFieldSelect) {
    console.error('Sort Field select element not found!');
    return;
  }

  sortFieldSelect.innerHTML = `<option value="">Select Field</option>`; // Reset the options

  // Populate the sort field options with the fields
  fields.forEach(field => {
    sortFieldSelect.innerHTML += `<option value="${field}">${collections[selectedCollection][field][0]}</option>`;
  });
}

// Function to handle Add Filter Button
let filterSelectedFieldList = new Set(["_id"]);

function addFilter() {
	
	if(! (filterSelectedFieldList.size < fields.length )){
		return;
	}
	
  const filterContainer = document.createElement("div");
  filterContainer.classList.add('primary-filter-item');

  const fieldSelect = document.createElement("select");
  fieldSelect.innerHTML = `<option value="">Select Field</option>`;
  fields.forEach(field => {
	if(! filterSelectedFieldList.has(field))
    fieldSelect.innerHTML += `<option value="${field}">${collections[selectedCollection][field][0]}</option>`;
  });

  const filterSelect = document.createElement("select");
  filterSelect.innerHTML = `<option value="">Select Filter</option>`;
  Object.keys(ConditionParser).forEach(condition => {
    filterSelect.innerHTML += `<option value="${condition}">${condition}</option>`;
  });

  const valueInput = document.createElement("input");
  valueInput.type = "text"; // Default type, will be updated dynamically
  
  const removeButton = document.createElement("button");
  removeButton.innerText = "Remove";
  removeButton.addEventListener('click',function() {
	  filterSelectedFieldList.delete(fieldSelect.value)
	  filterContainer.remove();
  });

  fieldSelect.addEventListener('change', function () {
    // Decide value type dynamically
    //const fieldType = collections[selectedCollection][fieldSelect.value][1];
    // valueInput.type = fieldType === "boolean" ? "checkbox" : "text";
	// primaryFilterButton.addEventListener("click", addFilter);
	filterSelectedFieldList.add(fieldSelect.value);
	filterSelect.removeEventListener('mousedown',preventDefaultEvent);
	fieldSelect.addEventListener('mousedown',preventDefaultEvent);
  });
  
  filterSelect.addEventListener('change',function() {
	  valueInput.removeEventListener('keydown',preventDefaultEvent);
	  const datatypeForFilter = ConditionParser[filterSelect.value] === "" ? collections[selectedCollection][fieldSelect.value][1] : ConditionParser[filterSelect.value] ;
	  valueInput.type = datatypeForFilter === "boolean" ? "checkbox" : datatypeForFilter;
  });
  
  
  filterSelect.addEventListener('mousedown',preventDefaultEvent);
  valueInput.addEventListener('keydown',preventDefaultEvent);

  filterContainer.appendChild(fieldSelect);
  filterContainer.appendChild(filterSelect);
  filterContainer.appendChild(valueInput);
  filterContainer.appendChild(removeButton);
  document.querySelector(".primary-filter-dynamic-loader").appendChild(filterContainer);
  
  // primaryFilterButton.removeEventListener("click", addFilter);
}

// Function to handle Add Update Button
let updateSelectedFieldList = new Set( ["_id"]);
function addUpdate() {
	
	if(! (updateSelectedFieldList.size < fields.length )){
		return;
	}
	
  const updateContainer = document.createElement("div");
  updateContainer.classList.add('update-item');

  const fieldSelect = document.createElement("select");
  fieldSelect.setAttribute("name","field-select");
  fieldSelect.innerHTML = `<option value="">Select Field</option>`;
  fields.forEach(field => {
	if(! updateSelectedFieldList.has(field))
		fieldSelect.innerHTML += `<option value="${field}">${collections[selectedCollection][field][0]}</option>`;
  });

  const updateSelect = document.createElement("select");
  updateSelect.innerHTML = `<option value="">Select Update</option>`;
  Object.keys(UpdateParser).forEach(update => {
    updateSelect.innerHTML += `<option value="${update}">${update}</option>`;
  });

  const valueInput = document.createElement("input");
  valueInput.type = "text"; // Default type, will be updated dynamically
  
  const removeButton = document.createElement("button");
  removeButton.innerText = "Remove";
  removeButton.addEventListener('click',function() {
	  updateSelectedFieldList.delete(fieldSelect.value);  // Keep all elements except the specified one
	  updateContainer.remove();
  });
  
  updateSelect.addEventListener('mousedown',preventDefaultEvent);
  valueInput.addEventListener('keydown',preventDefaultEvent);

  fieldSelect.addEventListener('change', function () {
    // Decide value type dynamically
    // const fieldType = collections[selectedCollection][fieldSelect.value][1];
    // valueInput.type = fieldType === "boolean" ? "checkbox" : "text";
	updateSelectedFieldList.add(fieldSelect.value);
	updateSelect.removeEventListener('mousedown',preventDefaultEvent);
	fieldSelect.addEventListener('mousedown',preventDefaultEvent);
  });
  
  updateSelect.addEventListener('change',function() {
	  valueInput.removeEventListener('keydown',preventDefaultEvent);
	  const datatypeForUpdate = UpdateParser[updateSelect.value] === "" ? collections[selectedCollection][fieldSelect.value][1] : UpdateParser[updateSelect.value] ;
	  valueInput.type = datatypeForUpdate === "boolean" ? "checkbox" : datatypeForUpdate;
  });

  updateContainer.appendChild(fieldSelect);
  updateContainer.appendChild(updateSelect);
  updateContainer.appendChild(valueInput);
  updateContainer.appendChild(removeButton);
  
  document.querySelector(".update-dynamic-loader").appendChild(updateContainer);
}

// Function to load buttons dynamically based on selected mode
function loadModeButtons() {
  const mode = document.getElementById('mode').value;
  const buttonsDiv = document.querySelector(".database-interaction-buttons");

  buttonsDiv.innerHTML = ""; // Reset buttons

  const modes = {
    "Default Mode": ["Query with Filter", "Edit with Filter", "Archive with Filter", "Delete with Filter"],
    "Query Mode": ["Query with Filter"],
    "Edit Mode": ["Edit with Filter"],
    "Archive Mode": ["Archive with Filter"],
    "Delete Mode": ["Delete with Filter"]
  };

  const buttons = modes[mode] ;//|| modes["Default Mode"];

  buttons.forEach(buttonText => {
    const button = document.createElement("button");
    button.innerHTML = buttonText;
	let action
	switch(buttonText){
		case "Query with Filter":
			action = queryWithFilter
			break
		case "Edit with Filter":
			action = updateWithFilter
			break
		case "Archive with Filter":
			action = archiveWithFilter
			break
		case "Delete with Filter":
			action = deleteWithFilter
			break
	}
	button.addEventListener('click',action);
    buttonsDiv.appendChild(button);
  });
}

async function queryWithFilter(){
	let data = {};
	
	data.collection = selectedCollection;
	data.primaryFilter = JSON.stringify(getFilterData());
	
	const secondaryFilter = getSecFilterData();
	if(Object.keys(secondaryFilter).length > 0) data.secondaryFilter = JSON.stringify(secondaryFilter);
	
	const fields = getCheckedFields();
	if( fields.length > 0 ) data.fields = JSON.stringify(fields);
	
	const sort = getSortValue();
	if( sort.length > 0 ) data.sort = JSON.stringify(sort);
	
	console.log(data);
	const response = await makeApiRequest("/admin/queryData", "GET", data);
	console.log(response.response);
	if(response.statusCode === 200)
		populateViewerContent(response.response.list, collections[selectedCollection])
	else alert(response.response.message)
}

function populateViewerContent(data, guide) {
    const viewerContent = document.querySelector('.viewer-content');
    viewerContent.innerHTML = ''; // Clear existing content

    // Iterate over each JSON object
    data.forEach(item => {
        const fieldContainer = document.createElement('div');
        fieldContainer.classList.add('field-container');
        
        for (const field in item) {
            // Check if field exists in guide
            if (guide[field]) {
                const [displayName, htmlDataType, fieldType] = guide[field];

                const fieldElement = document.createElement('div');
                fieldElement.classList.add('field');

                // Set display name as the label
                const label = document.createElement('label');
                label.textContent = displayName;
                fieldElement.appendChild(label);

                // Set the field value
                const value = document.createElement('p');
                value.textContent = item[field];
                fieldElement.appendChild(value);

                fieldContainer.appendChild(fieldElement);
            }
        }

        // Append each field container to the viewer content
        viewerContent.appendChild(fieldContainer);
    });
}

async function updateWithFilter(){
	let data = {};
	
	const secondaryFilter = getSecFilterData();
	console.log(secondaryFilter);
	if( Object.keys(secondaryFilter).length > 0 ){
		alert("secondary Filter is not empty, This may cause unexpected changes");
		return;
	}
	
	data.collection = selectedCollection;
	data.primaryFilter = JSON.stringify(getFilterData());
	data.multi = isMultiUpdateAllowed();
	data.update = JSON.stringify(getUpdateData());
	
	console.log(data);
	const response = await makeApiRequest("/admin/editData","PUT",data);
	console.log(response.response);
}

async function archiveWithFilter(){
	
	let data = {};
	
	data.collection = selectedCollection;
	data.multi = isMultiUpdateAllowed();
	data.primaryFilter = JSON.stringify(getFilterData());
	
	console.log(data);
	const response = await makeApiRequest("/admin/adminArchive", "PUT", data);
	console.log(response.response);
}

async function deleteWithFilter(){
	let data = {};
	
	data.collection = selectedCollection;
	data.multi = isMultiUpdateAllowed();
	data.primaryFilter = JSON.stringify(getFilterData());
	
	console.log(data);
	const response = await makeApiRequest("/admin/deleteArchive", "DELETE", data);
	console.log(response.response);
}

function loadCollectionOptions() {
  const collectionSelect = document.getElementById("collection");
  
  // Clear existing options
  collectionSelect.innerHTML = '<option value="">Select Collection</option>';
  
  // Populate with collections keys
  Object.keys(collections).forEach(collectionKey => {
    collectionSelect.innerHTML += `<option value="${collectionKey}">${collectionKey}</option>`;
  });
}

async function makeApiRequest(endpoint, method, data = null) {
  // If it's a GET request, encode the data into the URL query parameters
  if (method.toUpperCase() === 'GET' && data) {
    // Construct the query string
    const queryParams = new URLSearchParams(data).toString();
    // Append query parameters to the endpoint
    endpoint += `?${queryParams}`;
  }

  // Set up the request options
  const options = {
    method: method.toUpperCase(), // Make sure the method is uppercase (GET, POST, etc.)
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // If the method is not GET (i.e., POST, PUT, DELETE), include the data in the request body
  if (method.toUpperCase() !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }

  try {
    // Make the fetch request
    const response = await fetch(endpoint, options);

    // Get the response content type
    const responseType = response.headers.get('content-type');

    // Parse the response based on content type (JSON, text, etc.)
    let responseBody = {};
    if (responseType && responseType.includes('application/json')) {
      responseBody = await response.json(); // Parse as JSON if the response is JSON
    } else if (responseType && responseType.includes('text')) {
      responseBody = await response.text(); // Parse as text if the response is text
    } else {
      responseBody = await response.text(); // Default to text parsing
    }

    // Return an object containing status code, response type, and response body
    return {
      statusCode: response.status,
      responseType: responseType,
      response: responseBody,
    };
  } catch (error) {
    // Handle errors (e.g., network issues)
    return {
      statusCode: 500,
      responseType: 'application/json',
      response: { error: error.message },
    };
  }
}

function getFilterData() {
  const filtersData = {};

  // Get all filter items inside '.primary-filter-dynamic-loader'
  const filterItems = document.querySelectorAll(".primary-filter-dynamic-loader .primary-filter-item");

  filterItems.forEach(filterItem => {
    // Get the select fields and input
    const fieldSelect = filterItem.querySelector("select");
    const filterSelect = filterItem.querySelector("select:nth-of-type(2)");
    const valueInput = filterItem.querySelector("input");
    
    // Skip if any of the fields are empty or the field is already processed
    if (!fieldSelect || !filterSelect || !valueInput) return;

    const field = fieldSelect.value;
    const filter = filterSelect.value;
    let value = valueInput.value;

    // Skip if field, filter, or value is empty
    if (!field || !filter || !value) return;

    // Handle value input types (checkbox, datetime-local)
    if (valueInput.type === "checkbox") {
      value = valueInput.checked; // Boolean value for checkbox
    } else if (valueInput.type === "datetime-local") {
      value = new Date(value).toISOString(); // Convert datetime-local to ISO string
    }

    // Add or update the field in filtersData
    filtersData[field] = [filter, value];
  });

  return filtersData;
}

function getUpdateData() {
    const updates = {};
    
    // Select all the '.update-item' elements under '.update-dynamic-loader'
    document.querySelectorAll(".update-dynamic-loader .update-item").forEach(updateContainer => {
        const fieldSelect = updateContainer.querySelector("[name='field-select']");
        const updateSelect = updateContainer.querySelector("select:not([name='field-select'])");
        const valueInput = updateContainer.querySelector("input");
        
        const fieldValue = fieldSelect ? fieldSelect.value : "";
        const updateValue = updateSelect ? updateSelect.value : "";
        let inputValue = valueInput ? valueInput.value : "";

        // Skip if fieldSelect, updateSelect, or valueInput is empty
        if (!fieldValue || !updateValue || inputValue === "") {
            return;
        }

        // Ensure no duplicate fields in the final object
        if (!updates[fieldValue]) {
            updates[fieldValue] = [];
        }

        // If the input is a checkbox, treat it as boolean (true for checked, false for unchecked)
        if (valueInput.type === "checkbox") {
            inputValue = valueInput.checked;
        }
        // If it's a datetime-local, convert it to ISO date string
        else if (valueInput.type === "datetime-local") {
            inputValue = new Date(inputValue).toISOString();
        }

        // Add the first (and only) update and value for that field
        updates[fieldValue] = [updateValue, inputValue];
    });

    return updates;
}

function getSecFilterData() {
  const uniqueSelect = document.getElementById("secondary-filter-unique");
  const skipInput = document.getElementById("secondary-filter-skip");
  const limitInput = document.getElementById("secondary-filter-limit");

  // Get the value of the unique option
  const uniqueValue = uniqueSelect.value;

  // Get the values of skip and limit, and ensure they are valid numbers
  const skipValue = parseInt(skipInput.value, 10);
  const limitValue = parseInt(limitInput.value, 10);

  // Initialize an object to store valid values
  let filterValues = {};

  // Add 'unique' to the object if it's not an empty string
  if (uniqueValue !== "") {
    filterValues.unique = uniqueValue;
  }

  // Add 'skip' to the object if it's a valid non-negative number
  if (!isNaN(skipValue) && skipValue >= 0) {
    filterValues.skip = skipValue;
  }

  // Add 'limit' to the object if it's a valid non-negative number
  if (!isNaN(limitValue) && limitValue >= 0) {
    filterValues.limit = limitValue;
  }

  // Return the object
  return filterValues;
}

function getCheckedFields() {
    const checkedValues = [];
    const checkboxes = document.querySelectorAll('#query-customisations-fields input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkedValues.push(checkbox.value);
        }
    });
    
    return checkedValues;
}

function getSortValue() {
  const selectedField = document.getElementById("sort-field").value;
  const selectedOrder = parseInt(document.getElementById("order").value, 10); // Convert order value to integer
	let sortValue = [];
  // Ensure both values are selected and valid
  if (selectedField !=="" && !isNaN(selectedOrder)) {
    // Return the value in the format: [field, <int>1||-1]
	sortValue.push(selectedField);
	sortValue.push(selectedOrder);
  }
  return sortValue;  // Return null if either field or order is invalid or empty
}

function isMultiUpdateAllowed() {
  return document.getElementById("allow-multi-update").checked;
}