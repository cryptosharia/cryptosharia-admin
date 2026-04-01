const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('api-1.json'));
const result = {};

for (const [name, schema] of Object.entries(spec.components.schemas || {})) {
  if (name.includes('Body') || name.includes('Item') || name.includes('Data')) {
    const props = {};
    let required = schema.required || [];

    const properties = schema.properties || {};
    if (schema.allOf) {
      for (const part of schema.allOf) {
        if (part.properties) Object.assign(properties, part.properties);
        if (part.required) required = [...required, ...part.required];
      }
    }

    for (const [propName, meta] of Object.entries(properties)) {
      props[propName] = {
        type: meta.type,
        format: meta.format,
        enum: meta.enum,
        min: meta.min ?? meta.minimum,
        max: meta.max ?? meta.maximum,
        minLength: meta.minLength,
        maxLength: meta.maxLength,
      };
    }
    
    result[name] = {
      required: [...new Set(required)],
      properties: props
    };
  }
}

fs.writeFileSync('schema_validation.json', JSON.stringify(result, null, 2));
console.log("Written to schema_validation.json");
