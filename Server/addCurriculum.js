const mongoose = require('mongoose');
const Course = require('./Model/CourseModel');

async function addCurriculum() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hackverse');
    console.log('Connected to MongoDB');

    // Find the first course and add curriculum
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses`);

    if (courses.length > 0) {
      const course = courses[0];
      console.log('Updating course:', course.title);

      // Add sample curriculum
      course.curriculum = {
        sections: [
          {
            order: 1,
            title: 'Introduction to the Course',
            description: 'Getting started with the fundamentals',
            lectures: [
              {
                order: 1,
                title: 'Welcome to the Course',
                type: 'video',
                duration: '5:30',
                videoUrl: '/uploads/videos/sample.mp4',
                content: 'Welcome to this amazing course! In this lecture, we will introduce you to the main concepts you will learn.'
              },
              {
                order: 2,
                title: 'Course Overview',
                type: 'video', 
                duration: '8:45',
                videoUrl: '/uploads/videos/sample.mp4',
                content: 'Let us walk through what you will achieve by the end of this course.'
              }
            ]
          },
          {
            order: 2,
            title: 'Core Concepts',
            description: 'Deep dive into the main topics',
            lectures: [
              {
                order: 1,
                title: 'Understanding the Basics',
                type: 'video',
                duration: '12:20',
                videoUrl: '/uploads/videos/sample.mp4',
                content: 'In this lecture, we cover the fundamental concepts you need to know.'
              },
              {
                order: 2,
                title: 'Practice Assignment',
                type: 'assignment',
                duration: '30:00',
                assignment: {
                  submissionType: 'file',
                  maxFileSize: '10MB',
                  maxScore: 100,
                  description: 'Complete the practice exercises',
                  instructions: 'Download the practice files, complete the exercises, and submit your solution.'
                }
              }
            ]
          }
        ]
      };

      await course.save();
      console.log('Curriculum added successfully!');
      console.log('Course ID:', course._id);
      console.log('Sections added:', course.curriculum.sections.length);
    } else {
      console.log('No courses found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

addCurriculum();