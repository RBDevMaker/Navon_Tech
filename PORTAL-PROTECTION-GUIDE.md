# 🛡️ Portal Protection Guide

## Your Stable Portal is Protected!

I've created a **stable-portal** branch that preserves your employee portal design with Times New Roman font.

---

## 📋 How It Works

### The Two Branches:

1. **`main`** - Your working branch for daily changes
2. **`stable-portal`** - Your protected portal design (read-only backup)

---

## 🔄 Daily Workflow

### When Making Changes:

```bash
# Always work on main branch
git checkout main

# Make your changes
# ... edit files ...

# Commit and push as normal
git add .
git commit -m "Your changes"
git push origin main
```

### If Portal Gets Messed Up:

```bash
# Restore the portal from stable-portal branch
git checkout stable-portal -- frontend/src/SimpleApp.jsx

# Commit the restoration
git add frontend/src/SimpleApp.jsx
git commit -m "Restore portal from stable-portal branch"
git push origin main
```

---

## 🔒 Protecting the Stable Branch

### Rule #1: Never Push Directly to stable-portal
Only update `stable-portal` when you're 100% happy with a new portal design.

### Rule #2: Update stable-portal Only When Portal is Perfect

```bash
# When you have a new portal design you love:
git checkout main
git add frontend/src/SimpleApp.jsx
git commit -m "New portal design"
git push origin main

# Then update the stable branch:
git checkout stable-portal
git merge main
git push origin stable-portal

# Go back to main for daily work:
git checkout main
```

---

## 🚨 Emergency Recovery

If your portal gets changed and you need to restore it:

### On Your Laptop:
```bash
git checkout stable-portal -- frontend/src/SimpleApp.jsx
git add frontend/src/SimpleApp.jsx
git commit -m "Emergency restore: revert to stable portal design"
git push origin main
```

### On Your Computer:
```bash
git pull origin main
# Your portal is now restored!
```

---

## 📝 Best Practices

### ✅ DO:
- Work on `main` branch for all daily changes
- Keep `stable-portal` as your backup
- Only update `stable-portal` when portal design is perfect
- Use `git checkout stable-portal -- frontend/src/SimpleApp.jsx` to restore

### ❌ DON'T:
- Don't work directly on `stable-portal` branch
- Don't merge random changes into `stable-portal`
- Don't delete `stable-portal` branch
- Don't push to `stable-portal` unless portal is perfect

---

## 🎯 Quick Reference

### Check Which Branch You're On:
```bash
git branch
# * main  <- asterisk shows current branch
#   stable-portal
```

### Restore Portal from Stable:
```bash
git checkout stable-portal -- frontend/src/SimpleApp.jsx
git add frontend/src/SimpleApp.jsx
git commit -m "Restore portal design"
git push origin main
```

### View Stable Portal Without Changing Anything:
```bash
git checkout stable-portal
# Look around, but don't make changes
git checkout main  # Go back to main
```

---

## 💡 Pro Tips

1. **Before Big Changes**: If you're about to make major changes to the portal, first make sure `stable-portal` is up to date with your current good design.

2. **After Pulling from Another Computer**: If you pull changes and the portal looks wrong, immediately restore from `stable-portal`.

3. **Document Your Stable Version**: Add a comment at the top of SimpleApp.jsx noting when it was saved to stable-portal.

4. **Test Before Updating Stable**: Always test your portal thoroughly before updating the `stable-portal` branch.

---

## 🔍 Checking What Changed

To see what's different between your current portal and the stable version:

```bash
git diff stable-portal -- frontend/src/SimpleApp.jsx
```

---

## 📞 Need Help?

If you're unsure about anything:
1. Check which branch you're on: `git branch`
2. If in doubt, restore from stable: `git checkout stable-portal -- frontend/src/SimpleApp.jsx`
3. You can always restore the portal - it's safely stored in `stable-portal`!

---

**Remember**: The `stable-portal` branch is your safety net. It will always have your good portal design!
