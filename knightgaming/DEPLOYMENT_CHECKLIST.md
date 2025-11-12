# 🚀 Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Update all API keys with production values
- [ ] Generate secure JWT secrets (32+ characters)
- [ ] Change admin credentials from defaults
- [ ] Set `NODE_ENV=production`
- [ ] Update `CLIENT_URL` to production domain
- [ ] Configure SMTP settings for emails
- [ ] Set appropriate rate limits

### API Keys
- [ ] Stripe: Switch from test to live keys
- [ ] Stripe: Create production webhook endpoint
- [ ] Stripe: Configure webhook secret
- [ ] OpenAI: Use production API key
- [ ] RAWG: Verify API key is active
- [ ] Steam: Verify API key
- [ ] NewsAPI: Verify tier/limits

### Database
- [ ] Create production MongoDB database
- [ ] Set strong database password
- [ ] Configure database backups
- [ ] Run seed script (optional for production)
- [ ] Test database connection
- [ ] Set up Redis (if using)

### Security
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up fail2ban (optional)
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Review security headers
- [ ] Change all default passwords

### Stripe Setup
- [ ] Create product in Stripe Dashboard
- [ ] Create monthly price ($1.99/month)
- [ ] Copy Price ID to `STRIPE_MONTHLY_PRICE_ID`
- [ ] Set up webhook endpoint
- [ ] Test webhook locally with Stripe CLI
- [ ] Verify webhook in production

### Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test password reset
- [ ] Test game data fetching
- [ ] Test news fetching
- [ ] Test subscription checkout
- [ ] Test webhook handling
- [ ] Test AI features
- [ ] Test on mobile devices
- [ ] Test theme switching

## Deployment

### Server Setup
- [ ] Provision VPS/server
- [ ] Install Node.js 18+
- [ ] Install MongoDB
- [ ] Install Redis (optional)
- [ ] Install Nginx
- [ ] Install PM2
- [ ] Install Certbot

### Application Deployment
- [ ] Clone repository to server
- [ ] Install backend dependencies
- [ ] Copy and configure `.env`
- [ ] Build application (if needed)
- [ ] Run database migrations/seed
- [ ] Start application with PM2
- [ ] Configure PM2 startup script

### Web Server
- [ ] Configure Nginx
- [ ] Set up reverse proxy
- [ ] Configure SSL certificate
- [ ] Test Nginx configuration
- [ ] Reload Nginx

### Worker Scripts
- [ ] Verify PM2 ecosystem config
- [ ] Test worker scripts manually
- [ ] Verify cron schedule
- [ ] Check worker logs

## Post-Deployment

### Verification
- [ ] Test frontend loads
- [ ] Test API endpoints
- [ ] Test authentication flow
- [ ] Test database connection
- [ ] Test Redis connection (if using)
- [ ] Test external API calls
- [ ] Verify SSL certificate
- [ ] Check logs for errors

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Monitor API usage/costs
- [ ] Monitor database performance
- [ ] Check worker script execution
- [ ] Monitor Stripe webhooks

### Documentation
- [ ] Update README with production URLs
- [ ] Document server access
- [ ] Document backup procedures
- [ ] Create incident response plan
- [ ] Update API documentation

### Legal & Compliance
- [ ] Add Privacy Policy
- [ ] Add Terms of Service
- [ ] Add Cookie Policy
- [ ] Configure GDPR compliance
- [ ] Add disclaimer/legal notices

## Maintenance

### Regular Tasks
- [ ] Weekly: Check logs
- [ ] Weekly: Monitor costs
- [ ] Weekly: Review user feedback
- [ ] Monthly: Update dependencies
- [ ] Monthly: Security audit
- [ ] Monthly: Database backup test
- [ ] Quarterly: Review API usage
- [ ] Quarterly: Performance review

### Emergency Procedures
- [ ] Document rollback procedure
- [ ] Document database restore procedure
- [ ] Document server recovery
- [ ] Create emergency contact list
- [ ] Test backup/restore procedures

## Notes

### Important Reminders
- **Test Stripe webhooks** in test mode before going live
- **Monitor OpenAI costs** closely in first month
- **Set API rate limits** appropriate for your traffic
- **Backup database** before major changes
- **Keep secrets secure** - never commit to git
- **Update dependencies** regularly for security

### Common Issues
- **Webhook failures**: Check URL is accessible, secret is correct
- **API rate limits**: Monitor usage, implement caching
- **Memory issues**: Adjust PM2 max_memory_restart
- **Database performance**: Add indexes, optimize queries
- **High costs**: Review API usage, implement better caching

### Support Resources
- MongoDB: https://docs.mongodb.com/
- PM2: https://pm2.keymetrics.io/docs/
- Nginx: https://nginx.org/en/docs/
- Stripe: https://stripe.com/docs
- OpenAI: https://platform.openai.com/docs

---

**Last Updated**: [Date]
**Deployed By**: [Name]
**Production URL**: [URL]
