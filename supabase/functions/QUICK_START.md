# Edge Functions Quick Start Guide

## 🚀 Quick Deployment

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Link Your Project
```bash
supabase link --project-ref your-project-ref
```

### 3. Set Environment Variables
```bash
supabase secrets set ADMIN_SETUP_TOKEN=your-secret-token-here
```

### 4. Deploy Functions

**Windows (PowerShell)**:
```powershell
cd supabase/functions
.\deploy.ps1
```

**Linux/Mac (Bash)**:
```bash
cd supabase/functions
chmod +x deploy.sh
./deploy.sh
```

**Manual**:
```bash
supabase functions deploy bootstrap-first-admin --no-verify-jwt
supabase functions deploy delete-user-account --no-verify-jwt
supabase functions deploy delete-operator-account --no-verify-jwt
```

---

## 📝 Usage Examples

### Bootstrap First Admin

**Endpoint**: `POST /functions/v1/bootstrap-first-admin`

```bash
curl -X POST https://your-project.supabase.co/functions/v1/bootstrap-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@fantooo.com",
    "password": "SecurePass123!",
    "setupToken": "your-setup-token"
  }'
```

**Response**:
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "name": "Admin Name",
    "email": "admin@fantooo.com",
    "role": "super_admin"
  },
  "message": "Super admin account created successfully"
}
```

---

### Delete User Account

**Endpoint**: `POST /functions/v1/delete-user-account`

```bash
curl -X POST https://your-project.supabase.co/functions/v1/delete-user-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "reason": "user_requested",
    "requestedBy": "self"
  }'
```

**Response**:
```json
{
  "success": true,
  "refundAmount": 500,
  "refundCredits": 50,
  "message": "Account deleted successfully",
  "details": {
    "messagesAnonymized": true,
    "chatsCount": 5,
    "refundPending": true
  }
}
```

---

### Delete Operator Account

**Endpoint**: `POST /functions/v1/delete-operator-account`

```bash
curl -X POST https://your-project.supabase.co/functions/v1/delete-operator-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "operatorId": "operator-uuid",
    "adminId": "admin-uuid",
    "reason": "resignation"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Operator deleted successfully",
  "details": {
    "operatorId": "uuid",
    "operatorName": "Operator Name",
    "totalChatsHandled": 150,
    "qualityScore": 85.5,
    "performanceDataPreserved": true
  }
}
```

---

## 🔍 View Logs

```bash
# View recent logs
supabase functions logs bootstrap-first-admin

# Follow logs in real-time
supabase functions logs delete-user-account --follow

# View all functions
supabase functions list
```

---

## ⚠️ Important Notes

1. **bootstrap-first-admin** can only be run once
2. **delete-operator-account** fails if operator has active chats
3. **delete-user-account** is GDPR compliant and irreversible
4. All functions require proper authentication
5. Set `ADMIN_SETUP_TOKEN` before using bootstrap function

---

## 🐛 Troubleshooting

### "Invalid setup token"
- Check `ADMIN_SETUP_TOKEN` is set: `supabase secrets list`
- Verify token matches in request

### "Admin already exists"
- This is expected - bootstrap can only run once
- Use admin login instead

### "Operator has active chats"
- Reassign or close active chats first
- Check operator's active chats in admin panel

### Function returns 500
- Check logs: `supabase functions logs <function-name>`
- Verify database tables exist
- Check RLS policies

---

## 📚 Full Documentation

See [README.md](./README.md) for complete documentation.
