# Resume Submission and Review Platform

A modern web-based platform where users can upload their resumes and track review status, with an admin dashboard for reviewing and scoring submissions.

## 🚀 Features

- **User Dashboard**
  - Magic Link Authentication (passwordless)
  - Drag & Drop Resume Upload
  - PDF validation and file size checking
  - Resume status tracking (Pending, Approved, Needs Revision, Rejected)
  - File preview and download
  - Leaderboard view

- **Admin Dashboard**
  - View all submitted resumes
  - Review and score resumes
  - Status management with notes
  - Advanced filtering and search
  - Real-time statistics
  - PDF preview and download

- **Security & Performance**
  - Row Level Security (RLS) with Supabase
  - File upload to Supabase Storage
  - TypeScript for type safety
  - Responsive design with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (Database, Auth, Storage)
- **Styling**: Tailwind CSS
- **File Handling**: React Dropzone, React PDF
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🗄 Database Setup

Run the provided SQL schema in your Supabase SQL editor to create:

- **Users Table**: Store user profiles
- **Resumes Table**: Store resume metadata and status
- **Reviews Table**: Track review history
- **Storage Bucket**: For PDF file storage
- **Row Level Security**: Proper access controls
- **Triggers**: Auto-update timestamps

## 🔐 Authentication

The platform uses Supabase Magic Link authentication:
- Users sign in with their email
- Secure, passwordless authentication
- Automatic user profile creation
- Session management

## 📁 File Upload

- **Supported formats**: PDF only
- **File size limit**: 10MB
- **Validation**: Client and server-side
- **Storage**: Supabase Storage with proper access controls
- **Preview**: Direct PDF viewing in browser

## 🎯 User Flow

1. **Sign Up/In**: User enters email, receives magic link
2. **Upload Resume**: Drag & drop or browse to upload PDF
3. **Track Status**: View submission status and scores
4. **View Leaderboard**: See how they rank against others

## 👨‍💼 Admin Flow

1. **Access Dashboard**: Navigate to `/admin`
2. **Review Submissions**: View all resumes with user details
3. **Score & Status**: Use quick actions or custom review
4. **Add Notes**: Provide feedback for candidates
5. **Track Statistics**: Monitor overall submission metrics

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set Environment Variables**
   Add the same environment variables in Vercel dashboard

3. **Configure Build**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 🔧 Configuration

### Supabase Configuration

1. **Authentication Settings**
   - Enable email auth
   - Set site URL for magic links
   - Configure email templates

2. **Storage Settings**
   - Create 'resumes' bucket
   - Configure file size limits
   - Set up access policies

3. **Database Settings**
   - Run the schema SQL
   - Enable RLS on all tables
   - Configure proper policies

## 📊 Features in Detail

### File Upload Component
- Drag & drop interface
- Progress tracking
- Error handling
- File validation
- Preview functionality

### Review System
- Quick action buttons
- Custom scoring (0-100)
- Note taking
- Status tracking
- Bulk operations

### Security Features
- Row Level Security
- File access controls
- User authentication
- Input validation
- XSS protection

## 🚧 Future Improvements

- **Email Notifications**: Notify users when status changes
- **Bulk Operations**: Multi-select for admin actions
- **Resume Parsing**: Extract text content for better search
- **Analytics Dashboard**: Detailed reporting and metrics
- **Comment System**: Thread-based feedback
- **Version Control**: Track resume revisions
- **Integration**: Connect with HR systems
- **Mobile App**: React Native version

## 🐛 Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check file size (max 10MB)
   - Ensure PDF format
   - Verify Supabase storage permissions

2. **Authentication Issues**
   - Check email provider settings
   - Verify Supabase auth configuration
   - Check browser cookies/localStorage

3. **Database Errors**
   - Verify RLS policies
   - Check environment variables
   - Ensure schema is properly applied

### Debug Tips

- Check browser console for errors
- Verify Supabase dashboard for logs
- Use network tab to inspect requests
- Check environment variables

## 📝 API Routes

- `GET /auth/callback` - Handle auth callbacks
- All other operations use Supabase client-side

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational/evaluation purposes.

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review Supabase documentation
- Create an issue in the repository

---

Built with ❤️ using Next.js and Supabase