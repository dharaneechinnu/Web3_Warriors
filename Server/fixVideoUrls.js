/**
 * fixVideoUrls.js
 * One-time migration script to fix intro video URLs in mentor applications
 * Run with: node fixVideoUrls.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const MentorApplication = require('./Model/MentorApplication');

const oldBaseUrl = 'https://api.ardk.online';
const newBaseUrl = process.env.SERVER_URL?.replace(/\/$/, '') || 'http://localhost:3500';

console.log(`\n${'═'.repeat(70)}`);
console.log('🔧 Fixing mentor application video URLs');
console.log(`   Old base: ${oldBaseUrl}`);
console.log(`   New base: ${newBaseUrl}`);
console.log(`${'─'.repeat(70)}\n`);

mongoose.connect(process.env.MONGODB)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    // Find all applications with old production URLs
    const applications = await MentorApplication.find({
      $or: [
        { introVideoUrl: { $regex: '^https://api.ardk.online' } },
        { resumeUrl: { $regex: '^https://api.ardk.online' } }
      ]
    });

    console.log(`Found ${applications.length} applications with old URLs\n`);

    if (applications.length === 0) {
      console.log('✅ No applications need fixing. Exiting.\n');
      process.exit(0);
    }

    let fixed = 0;
    for (const app of applications) {
      console.log(`\n📝 Application: ${app.name} (${app._id})`);
      
      let updated = false;
      const updates = {};

      // Fix intro video URL
      if (app.introVideoUrl && app.introVideoUrl.startsWith(oldBaseUrl)) {
        const oldIntroUrl = app.introVideoUrl;
        updates.introVideoUrl = app.introVideoUrl.replace(oldBaseUrl, newBaseUrl);
        console.log(`   ❌ OLD intro: ${oldIntroUrl}`);
        console.log(`   ✅ NEW intro: ${updates.introVideoUrl}`);
        updated = true;
      }

      // Fix resume URL
      if (app.resumeUrl && app.resumeUrl.startsWith(oldBaseUrl)) {
        const oldResumeUrl = app.resumeUrl;
        updates.resumeUrl = app.resumeUrl.replace(oldBaseUrl, newBaseUrl);
        console.log(`   ❌ OLD resume: ${oldResumeUrl}`);
        console.log(`   ✅ NEW resume: ${updates.resumeUrl}`);
        updated = true;
      }

      if (updated) {
        await MentorApplication.findByIdAndUpdate(app._id, updates);
        fixed++;
        console.log(`   💾 Saved to database`);
      }
    }

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`✅ Migration complete — fixed ${fixed} applications`);
    console.log(`${'═'.repeat(70)}\n`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
