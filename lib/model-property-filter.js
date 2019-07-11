'use strict';

// Create a property filter for use in model filtering
module.exports = (property, value) => {
    const values = (value && typeof value === 'string' ? value.split(',') : []);
    return (model) => {
        const propertyValue = model.get(property);

        // If there's no filter, include the model
        if (!values.length) {
            return true;
        }

        // If the filter contains the word "all" and the property is a string
        // or an array with at least one value, include the model.
        if (values.includes('all') && (typeof propertyValue === 'string' || (Array.isArray(propertyValue) && propertyValue.length > 0))) {
            return true;
        }

        // If the filter is just "none", "null", or "undefined", keep the model if it has a falsy or empty value
        if (values.length === 1 && (values[0] === 'none' || values[0] === 'null' || values[0] === 'undefined')) {
            if (Array.isArray(propertyValue)) {
                return (propertyValue.length === 0);
            } else {
                return (Boolean(propertyValue) === false);
            }
        }

        // Keep the model if the property is set to one of the filter values
        if (Array.isArray(propertyValue)) {
            return values.some(value => propertyValue.includes(value));
        } else {
            return values.includes(propertyValue);
        }

    };
};
