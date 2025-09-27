# Deployment Guide

This guide will help you deploy the Resume Review Platform to Vercel with Supabase as the backend.

## 🎯 Prerequisites

- Node.js 18+ installed
- Git repository with your code
- Vercel account
- Supabase account

## 📋 Step-by-Step Deployment

### 1. Set up Supabase

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New project"
   - Choose your organization and region
   - Set a strong database password

2. **Configure the database**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Click "Run" to execute the schema

3. **Configure Authentication**
   - Go to Authentication > Settings
   - Add your domain to "Site URL": `https://your-app.vercel.app`
   - Configure additional redirect URLs if needed
   - Enable email authentication
   - Customize email templates (optional)

4. **Configure Storage**
   - The schema already creates the necessary bucket and policies
   - Verify the "resumes" bucket exists in Storage

5. **Get your API keys**
   - Go to Project Settings > API
   - Copy your `Project URL` and `anon/public key`
   - Copy your `service_role key` (keep this secret!)

### 2. Prepare for Deployment

1. **Update environment variables**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Test locally**
   ```bash
   npm run dev
   ```
   - Test user registration and login
   - Test resume upload
   - Test admin functionality

3. **Build and check for errors**
   ```bash
   npm run build
   npm run lint
   npm run type-check
   ```

### 3. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. **Connect your repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

2. **Configure the project**
   - Framework Preset: Next.js
   - Root Directory: `Frontend` (if your project is in a subdirectory)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set environment variables**
   In Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add each environment variable:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

#### Option B: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd Frontend
   vercel
   ```
   - Follow the prompts
   - Set up environment variables when prompted

4. **Set environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

### 4. Post-Deployment Configuration

1. **Update Supabase settings**
   - Go to Authentication > Settings in Supabase
   - Add your Vercel domain to "Site URL"
   - Add to "Additional Redirect URLs" if needed

2. **Test the deployment**
   - Visit your deployed app
   - Test user registration (check email)
   - Test resume upload
   - Test admin functionality
   - Check error handling

3. **Configure custom domain (optional)**
   - In Vercel dashboard, go to Project Settings > Domains
   - Add your custom domain
   - Update Supabase settings with new domain

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin operations) | Yes |

### Build Settings

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

## 🚨 Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` to git
   - Use Vercel's environment variable system
   - Keep service role key secret

2. **Supabase Security**
   - Review RLS policies
   - Set appropriate file size limits
   - Configure CORS settings
   - Use strong database password

3. **Domain Configuration**
   - Set correct site URLs in Supabase
   - Use HTTPS in production
   - Configure security headers

## 🐛 Troubleshooting

### Common Deployment Issues

1. **Build fails**
   ```bash
   # Check for TypeScript errors
   npm run type-check
   
   # Fix linting issues
   npm run lint:fix
   
   # Check for missing dependencies
   npm install
   ```

2. **Authentication not working**
   - Check site URL in Supabase settings
   - Verify environment variables
   - Check browser console for errors
   - Ensure email provider allows Supabase emails

3. **File upload fails**
   - Check Supabase storage policies
   - Verify bucket exists and is properly configured
   - Check file size limits
   - Test with different file types

4. **Database connection issues**
   - Verify environment variables
   - Check Supabase project status
   - Review RLS policies
   - Check network/firewall settings

### Debug Commands

```bash
# Check build locally
npm run build

# Check types
npm run type-check

# Check linting
npm run lint

# Check Vercel logs
vercel logs

# Check environment variables
vercel env ls
```

## 📊 Monitoring

### Vercel Analytics
- Enable Web Analytics in Vercel dashboard
- Monitor performance and usage
- Set up error tracking

### Supabase Monitoring
- Monitor database performance
- Check storage usage
- Review authentication logs
- Set up alerts for errors

## 🔄 Updates and Maintenance

### Updating the Application
1. Make changes to your code
2. Test locally
3. Push to your Git repository
4. Vercel will automatically deploy

### Database Migrations
1. Update schema in Supabase SQL editor
2. Test with staging data
3. Apply to production
4. Update types if needed

### Backup Strategy
1. Regular database backups via Supabase
2. Export user data periodically
3. Backup storage files
4. Document schema changes

## 🎉 Go Live Checklist

- [ ] Supabase project configured
- [ ] Database schema applied
- [ ] Storage bucket created
- [ ] Authentication configured
- [ ] Environment variables set
- [ ] Application deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] User registration tested
- [ ] File upload tested
- [ ] Admin functionality tested
- [ ] Error handling verified
- [ ] Performance optimized
- [ ] Monitoring set up

## 🆘 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review Vercel documentation
3. Check Supabase documentation
4. Look at browser console errors
5. Check server logs in Vercel dashboard

