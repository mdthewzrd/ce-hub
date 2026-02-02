# Stop Browser Notifications

## Quick Fix - In Browser Console

Run this in your browser console (F12 → Console):

```javascript
// Disable all notifications
Notification.requestPermission = function(callback) {
  callback('denied');
  return Promise.resolve('denied');
};

// Override existing permission
Object.defineProperty(Notification, 'permission', {
  get: function() { return 'denied'; },
  set: function() {}
});

console.log('✅ Notifications disabled for this session');
```

## Permanent Fix - Browser Settings

### Chrome/Edge:
1. Click the **lock icon** 🔒 in the address bar (left side)
2. Find **"Notifications"** in the list
3. Change it to **"Block"** or **"Don't allow"**
4. Refresh the page

### Alternative Method:
1. Open **Settings** → **Privacy and security**
2. Click **Site Settings** → **Notifications**
3. Find `localhost:5665` in the list
4. Set to **"Block"**

### Firefox:
1. Click the **lock icon** 🔒 in the address bar
2. Click **"Permissions"** → **"Notifications"**
3. Select **"Block"**

## For This Site Only

If you want to keep notifications globally but disable them for this development site:

```
1. Click the lock icon 🔒 next to localhost:5665
2. Find "Notifications"
3. Select "Block"
```

The notifications will stop immediately! 🔕
