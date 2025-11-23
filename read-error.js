```javascript
import fs from 'fs';

try {
    const content = fs.readFileSync('error.log', 'utf8');
    const json = JSON.parse(content);
  console.log('ERROR DETAILS:', json.details);
} catch (e) {
  console.error('Failed to read/parse error.log:', e);
}
```
