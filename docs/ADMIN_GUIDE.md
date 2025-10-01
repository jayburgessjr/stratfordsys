# 🔧 Administrator Guide - Stratford AI Wealth Engine

## Administrative Overview

### Admin Role Responsibilities
- **User Management**: Account creation, verification, and access control
- **System Monitoring**: Performance, security, and compliance oversight
- **Compliance Management**: KYC/AML oversight, regulatory reporting
- **Risk Management**: Portfolio monitoring, position limits, alerts
- **Data Management**: Backups, retention policies, data quality
- **System Configuration**: Feature flags, rate limits, system settings

## Admin Dashboard Access

### Accessing Admin Panel
1. Login with administrator credentials
2. Navigate to `/admin` or click "Admin Panel" in user menu
3. Admin access requires `ADMIN` or `COMPLIANCE` role
4. All admin actions are logged and auditable

### Admin Dashboard Sections
- **User Management**: Manage user accounts and permissions
- **Compliance Dashboard**: KYC/AML status and alerts
- **System Monitor**: Performance metrics and health checks
- **Risk Management**: Portfolio monitoring and limits
- **Audit Trail**: Complete system activity logs
- **System Settings**: Configuration and feature flags

## User Management

### User Account Administration

#### **User Search & Filtering**
```typescript
// Navigate to Admin > Users
// Available filters:
- Email address or user ID
- Account status (Active, Suspended, Pending)
- KYC status (Pending, Approved, Rejected)
- Registration date range
- Role (USER, TRADER, ADMIN, COMPLIANCE)
- Risk level (Low, Medium, High)
```

#### **User Account Actions**
1. **View User Details**:
   - Personal information
   - Account balance and positions
   - Trading history
   - KYC/AML status
   - Login history

2. **Account Management**:
   - Suspend/unsuspend accounts
   - Reset passwords
   - Update user roles
   - Modify account limits
   - Add account notes

3. **Account Verification**:
   - Review KYC documents
   - Approve/reject verification
   - Request additional documentation
   - Override verification decisions

#### **Bulk User Operations**
```typescript
// Example bulk operations:
// 1. Export user data
GET /api/admin/users/export?format=csv&filters=...

// 2. Bulk password reset
POST /api/admin/users/bulk-password-reset
{
  "userIds": ["user1", "user2"],
  "forceReset": true
}

// 3. Bulk role updates
POST /api/admin/users/bulk-role-update
{
  "userIds": ["user1", "user2"],
  "newRole": "TRADER"
}
```

### Role-Based Access Control

#### **User Roles and Permissions**
| Role | Permissions | Description |
|------|-------------|-------------|
| **USER** | Basic trading, portfolio view | Standard retail investor |
| **TRADER** | Advanced trading, margin, options | Professional trader |
| **ADMIN** | Full system access | System administrator |
| **COMPLIANCE** | User management, audit access | Compliance officer |

#### **Permission Management**
1. **Modify User Roles**:
   ```typescript
   // Change user role
   PUT /api/admin/users/{userId}/role
   {
     "newRole": "TRADER",
     "reason": "Account upgrade request",
     "effectiveDate": "2024-01-01"
   }
   ```

2. **Custom Permissions**:
   - Enable/disable specific features per user
   - Set trading limits and restrictions
   - Configure access to beta features

## Compliance Management

### KYC/AML Administration

#### **KYC Review Process**
1. **Pending Reviews Dashboard**:
   - Navigate to **Admin > Compliance > KYC Reviews**
   - View pending verification requests
   - Sort by submission date, risk score, or user type

2. **Document Review**:
   - View uploaded documents in secure viewer
   - Validate document authenticity
   - Check for completeness and clarity
   - Compare information across documents

3. **Decision Making**:
   ```typescript
   // Approve KYC
   POST /api/admin/kyc/{recordId}/approve
   {
     "reviewerNotes": "All documents verified",
     "riskLevel": "LOW"
   }

   // Reject KYC
   POST /api/admin/kyc/{recordId}/reject
   {
     "reason": "Document unclear",
     "requiredActions": ["Resubmit passport photo"]
   }
   ```

#### **AML Monitoring**
1. **Suspicious Activity Monitoring**:
   - Real-time alerts for unusual trading patterns
   - Large transaction monitoring
   - Velocity checks for deposits/withdrawals
   - Cross-reference against watchlists

2. **SAR (Suspicious Activity Report) Management**:
   ```typescript
   // Create SAR
   POST /api/admin/aml/sar
   {
     "userId": "user123",
     "activityType": "UNUSUAL_TRADING_PATTERN",
     "description": "Multiple large trades in penny stocks",
     "attachments": ["trade_history.pdf"]
   }
   ```

3. **Watchlist Management**:
   - Upload and maintain OFAC, PEP, and other watchlists
   - Real-time screening of new users
   - Alert system for watchlist matches

### Regulatory Reporting

#### **Automated Reports**
1. **Daily Reports**:
   - Large trader reporting
   - Position limit monitoring
   - Margin call notifications
   - Failed settlement tracking

2. **Periodic Reports**:
   - Monthly portfolio summaries
   - Quarterly compliance metrics
   - Annual audit preparations
   - Regulatory examination support

#### **Manual Report Generation**
```typescript
// Generate custom compliance report
POST /api/admin/reports/compliance
{
  "reportType": "LARGE_TRADER_POSITIONS",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "filters": {
    "minPositionValue": 1000000
  }
}
```

## Risk Management

### Portfolio Risk Monitoring

#### **Real-Time Risk Dashboard**
1. **System-Wide Metrics**:
   - Total assets under management
   - Aggregate portfolio VaR (Value at Risk)
   - Concentration risk by security/sector
   - Leverage ratios across accounts

2. **Individual Account Monitoring**:
   - Position concentrations
   - Margin utilization
   - Risk-adjusted returns
   - Compliance with investment guidelines

#### **Risk Alerts and Limits**
```typescript
// Set portfolio limits
PUT /api/admin/risk/limits/{userId}
{
  "maxPositionPercentage": 10,  // Max 10% in single security
  "maxSectorAllocation": 25,     // Max 25% in single sector
  "maxLeverage": 2.0,           // Max 2:1 leverage
  "alerts": {
    "concentrationThreshold": 8,  // Alert at 8%
    "volatilityThreshold": 0.25   // Alert if portfolio vol > 25%
  }
}
```

#### **Risk Override Management**
1. **Temporary Overrides**:
   - Allow trades that exceed normal limits
   - Set expiration dates for overrides
   - Require additional approvals for large overrides

2. **Override Audit Trail**:
   - Track all override requests and approvals
   - Document business justification
   - Monitor override usage patterns

### Market Risk Controls

#### **Circuit Breakers**
```typescript
// Configure trading halts
POST /api/admin/risk/circuit-breakers
{
  "triggers": [
    {
      "condition": "MARKET_VOLATILITY_HIGH",
      "threshold": 0.05,  // 5% market move
      "action": "HALT_NEW_ORDERS"
    },
    {
      "condition": "INDIVIDUAL_STOCK_VOLATILITY",
      "threshold": 0.20,  // 20% individual stock move
      "action": "REQUIRE_MANUAL_REVIEW"
    }
  ]
}
```

#### **Position Limits**
- Maximum position sizes by account type
- Sector concentration limits
- Geographic exposure limits
- Derivative exposure controls

## System Monitoring

### Performance Monitoring

#### **Real-Time Metrics Dashboard**
1. **Application Performance**:
   - Response times by endpoint
   - Database query performance
   - Cache hit rates
   - Error rates and exceptions

2. **Infrastructure Metrics**:
   - CPU and memory utilization
   - Database connections
   - Queue lengths
   - Network latency

#### **Alert Configuration**
```typescript
// Set up performance alerts
POST /api/admin/monitoring/alerts
{
  "name": "High Response Time Alert",
  "condition": {
    "metric": "api_response_time_p95",
    "operator": "greater_than",
    "threshold": 2000,  // 2 seconds
    "duration": "5m"    // For 5 minutes
  },
  "actions": ["email", "slack", "pagerduty"]
}
```

### Security Monitoring

#### **Security Dashboard**
1. **Authentication Metrics**:
   - Failed login attempts
   - Suspicious login patterns
   - Geographic login analysis
   - MFA bypass attempts

2. **Data Access Monitoring**:
   - Unusual data access patterns
   - Bulk data exports
   - Admin action auditing
   - API key usage tracking

#### **Incident Response**
```typescript
// Lock user account for security
POST /api/admin/security/lock-account
{
  "userId": "user123",
  "reason": "SUSPECTED_COMPROMISE",
  "lockType": "IMMEDIATE",
  "notifyUser": true
}

// Security incident logging
POST /api/admin/security/incident
{
  "severity": "HIGH",
  "category": "UNAUTHORIZED_ACCESS",
  "description": "Multiple failed admin login attempts",
  "affectedUsers": ["admin123"],
  "mitigationSteps": ["Account locked", "Password reset required"]
}
```

## Data Management

### Backup Administration

#### **Backup Monitoring**
1. **Backup Status Dashboard**:
   - Daily backup completion status
   - Backup file sizes and integrity
   - Recovery point objectives (RPO)
   - Recovery time objectives (RTO)

2. **Backup Configuration**:
   ```bash
   # Configure backup schedules
   # Daily incremental backups
   0 1 * * * /opt/scripts/incremental-backup.sh

   # Weekly full backups
   0 2 * * 0 /opt/scripts/full-backup.sh

   # Monthly archive backups
   0 3 1 * * /opt/scripts/archive-backup.sh
   ```

#### **Data Recovery Procedures**
1. **Point-in-Time Recovery**:
   ```sql
   -- Example recovery to specific timestamp
   pg_restore --clean --create --if-exists \
     --dbname=stratford_prod \
     --jobs=4 \
     /backups/stratford_20240101_020000.backup
   ```

2. **Selective Data Recovery**:
   - Restore individual user accounts
   - Recover specific date ranges
   - Restore deleted records with audit trail

### Data Retention Management

#### **Automated Retention Policies**
```typescript
// View active retention policies
GET /api/admin/data-retention/policies

// Create new retention policy
POST /api/admin/data-retention/policies
{
  "name": "Trade History Retention",
  "dataType": "TRADE_RECORDS",
  "retentionPeriod": "7_YEARS",
  "archiveAfter": "3_YEARS",
  "deleteAfter": "10_YEARS",
  "schedule": "0 2 * * *"  // Daily at 2 AM
}
```

#### **Manual Data Purging**
1. **GDPR Right to Erasure**:
   ```typescript
   // Process deletion request
   POST /api/admin/data-retention/delete-user
   {
     "userId": "user123",
     "requestId": "gdpr_req_456",
     "legalBasis": "USER_REQUEST",
     "verificationComplete": true
   }
   ```

2. **Compliance-Driven Deletion**:
   - Automatic deletion after retention periods
   - Regulatory requirement compliance
   - Audit trail maintenance

## System Configuration

### Feature Flag Management

#### **Feature Toggle Dashboard**
```typescript
// View all feature flags
GET /api/admin/feature-flags

// Toggle feature flag
PUT /api/admin/feature-flags/enable-options-trading
{
  "enabled": true,
  "targetUsers": ["TRADER", "ADMIN"],
  "rolloutPercentage": 10,  // 10% gradual rollout
  "schedule": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

#### **Environment Configuration**
1. **Rate Limiting Configuration**:
   ```typescript
   // Update rate limits
   PUT /api/admin/config/rate-limits
   {
     "api": {
       "authenticated": 1000,    // per minute
       "unauthenticated": 100    // per minute
     },
     "trading": {
       "orders": 60,             // per minute
       "cancellations": 30       // per minute
     }
   }
   ```

2. **System Maintenance**:
   ```typescript
   // Schedule maintenance window
   POST /api/admin/maintenance/schedule
   {
     "startTime": "2024-01-01T02:00:00Z",
     "endTime": "2024-01-01T04:00:00Z",
     "description": "Database optimization",
     "affectedServices": ["trading", "portfolio"],
     "notifyUsers": true
   }
   ```

## Audit and Compliance

### Audit Trail Management

#### **Comprehensive Activity Logging**
All admin actions are automatically logged:
```typescript
// Example audit log entry
{
  "timestamp": "2024-01-01T10:30:00Z",
  "adminUserId": "admin123",
  "action": "USER_ROLE_CHANGE",
  "targetUserId": "user456",
  "details": {
    "oldRole": "USER",
    "newRole": "TRADER",
    "reason": "Account upgrade request"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "sess_789"
}
```

#### **Audit Report Generation**
```typescript
// Generate audit report
POST /api/admin/audit/reports
{
  "reportType": "ADMIN_ACTIONS",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "filters": {
    "adminUsers": ["admin123", "admin456"],
    "actions": ["USER_ROLE_CHANGE", "ACCOUNT_SUSPENSION"]
  },
  "format": "PDF"
}
```

### Regulatory Examination Support

#### **Examination Preparation**
1. **Data Export for Regulators**:
   ```typescript
   // Export examination data
   POST /api/admin/regulatory/export
   {
     "examinerReference": "SEC_EXAM_2024_001",
     "dataTypes": ["USER_RECORDS", "TRADE_HISTORY", "COMPLIANCE_RECORDS"],
     "dateRange": {
       "start": "2023-01-01",
       "end": "2024-01-01"
     },
     "encryptionRequired": true
   }
   ```

2. **Examination Response Tracking**:
   - Track regulator requests
   - Monitor response deadlines
   - Document examination findings
   - Implement required changes

## Emergency Procedures

### System Emergency Response

#### **Trading Halt Procedures**
```typescript
// Emergency trading halt
POST /api/admin/emergency/halt-trading
{
  "reason": "SYSTEM_INSTABILITY",
  "scope": "ALL_TRADING",  // or "SPECIFIC_SECURITIES"
  "duration": "UNTIL_MANUAL_RESUME",
  "notificationChannels": ["email", "sms", "platform"]
}
```

#### **Security Incident Response**
1. **Immediate Actions**:
   - Lock affected accounts
   - Revoke API keys
   - Enable enhanced monitoring
   - Notify security team

2. **Investigation Support**:
   - Preserve audit logs
   - Generate incident reports
   - Coordinate with external security firms
   - Regulatory notification if required

### Business Continuity

#### **Disaster Recovery**
1. **Failover Procedures**:
   ```bash
   # Activate disaster recovery site
   ./scripts/activate-dr-site.sh

   # Update DNS records
   ./scripts/update-dns-failover.sh

   # Notify users of maintenance
   ./scripts/send-maintenance-notification.sh
   ```

2. **Data Recovery**:
   - Restore from latest backups
   - Verify data integrity
   - Resume normal operations
   - Conduct post-incident review

## Reporting and Analytics

### Administrative Reports

#### **Daily Operations Report**
- New user registrations
- Account verification status
- Trading volume and revenue
- System performance metrics
- Security incidents
- Compliance alerts

#### **Weekly Management Dashboard**
- Key performance indicators
- Risk metrics
- Compliance status
- Customer satisfaction scores
- Financial performance
- System uptime and availability

#### **Custom Report Builder**
```typescript
// Create custom report
POST /api/admin/reports/custom
{
  "name": "High Value Account Analysis",
  "dataSource": "USER_ACCOUNTS",
  "filters": {
    "accountValue": {"min": 1000000},
    "tradingFrequency": {"min": "WEEKLY"}
  },
  "metrics": ["totalValue", "tradingVolume", "profitLoss"],
  "groupBy": ["registrationDate", "accountType"],
  "schedule": "MONTHLY"
}
```

This administrator guide provides comprehensive coverage of all administrative functions within the Stratford AI Wealth Engine. For additional support or questions about specific administrative procedures, contact the development team or refer to the technical documentation.