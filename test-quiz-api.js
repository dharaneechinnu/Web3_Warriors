// Test script to verify quiz API endpoints
const axios = require('axios');

const baseURL = 'http://localhost:3500/api/courses';

async function testQuizEndpoints() {
  try {
    console.log('🧪 Testing Quiz API Endpoints...\n');
    
    // First, get all courses to find a course with quizzes
    console.log('1. Fetching all courses...');
    const coursesResponse = await axios.get(`${baseURL}/getall`);
    
    if (coursesResponse.data.success && coursesResponse.data.courses.length > 0) {
      console.log(`✅ Found ${coursesResponse.data.courses.length} courses`);
      
      // Find a course with curriculum that has quizzes
      let testCourse = null;
      let quizLecture = null;
      let sectionIndex = -1;
      let lectureIndex = -1;
      
      for (const course of coursesResponse.data.courses) {
        if (course.curriculum && course.curriculum.sections) {
          for (let sIndex = 0; sIndex < course.curriculum.sections.length; sIndex++) {
            const section = course.curriculum.sections[sIndex];
            if (section.lectures) {
              for (let lIndex = 0; lIndex < section.lectures.length; lIndex++) {
                const lecture = section.lectures[lIndex];
                if (lecture.type === 'quiz') {
                  testCourse = course;
                  quizLecture = lecture;
                  sectionIndex = sIndex;
                  lectureIndex = lIndex;
                  break;
                }
              }
            }
            if (testCourse) break;
          }
          if (testCourse) break;
        }
      }
      
      if (testCourse && quizLecture) {
        console.log(`✅ Found quiz lecture: "${quizLecture.title}" in course: "${testCourse.title}"`);
        console.log(`📍 Location: Section ${sectionIndex}, Lecture ${lectureIndex}`);
        
        // Test 2: Get learner content
        console.log('\n2. Testing learner content API...');
        try {
          const learnerContentResponse = await axios.get(`${baseURL}/learner/content/${testCourse._id}`);
          if (learnerContentResponse.data.success) {
            console.log('✅ Learner content API working');
            console.log(`📚 Course: ${learnerContentResponse.data.course.title}`);
            console.log(`📑 Sections: ${learnerContentResponse.data.course.curriculum.sections.length}`);
          } else {
            console.log('❌ Learner content API failed:', learnerContentResponse.data.message);
          }
        } catch (error) {
          console.log('❌ Learner content API error:', error.message);
        }
        
        // Test 3: Get specific quiz data
        console.log('\n3. Testing quiz data API...');
        try {
          const quizEndpoint = `${baseURL}/${testCourse._id}/section/${sectionIndex}/lecture/${lectureIndex}/quiz`;
          console.log(`📡 Testing: ${quizEndpoint}`);
          
          const quizResponse = await axios.get(quizEndpoint);
          if (quizResponse.data.success) {
            console.log('✅ Quiz data API working');
            console.log(`📝 Quiz: ${quizResponse.data.quiz.title || 'Untitled Quiz'}`);
            console.log(`❓ Questions: ${quizResponse.data.quiz.questions.length}`);
            console.log(`🎯 Passing Score: ${quizResponse.data.quiz.passingScore}%`);
          } else {
            console.log('❌ Quiz data API failed:', quizResponse.data.message);
          }
        } catch (error) {
          console.log('❌ Quiz data API error:', error.message);
        }
        
        // Test 4: Submit mock quiz answers (if quiz has questions)
        console.log('\n4. Testing quiz submission...');
        try {
          const submitEndpoint = `${baseURL}/${testCourse._id}/section/${sectionIndex}/lecture/${lectureIndex}/quiz/submit`;
          console.log(`📡 Testing: ${submitEndpoint}`);
          
          // Create mock answers based on quiz questions
          const mockAnswers = [];
          if (quizLecture.quiz && quizLecture.quiz.questions) {
            quizLecture.quiz.questions.forEach((question, index) => {
              if (question.type === 'single_correct' && question.choices) {
                mockAnswers.push({
                  questionId: question._id,
                  questionIndex: index,
                  selectedIndex: 0 // Select first option
                });
              } else if (question.type === 'multiple_correct' && question.choices) {
                mockAnswers.push({
                  questionId: question._id,
                  questionIndex: index,
                  selectedIndices: [0] // Select first option
                });
              } else if (question.type === 'short_answer') {
                mockAnswers.push({
                  questionId: question._id,
                  questionIndex: index,
                  textAnswer: 'Test answer'
                });
              }
            });
          }
          
          const submissionData = {
            learnerId: 'test-learner-id',
            answers: mockAnswers,
            submittedAt: new Date().toISOString()
          };
          
          const submitResponse = await axios.post(submitEndpoint, submissionData);
          if (submitResponse.data.success) {
            console.log('✅ Quiz submission API working');
            console.log(`📊 Result: ${submitResponse.data.result.passed ? 'PASSED' : 'FAILED'}`);
            console.log(`💯 Score: ${submitResponse.data.result.earnedMarks}/${submitResponse.data.result.totalMarks} (${submitResponse.data.result.percentage}%)`);
          } else {
            console.log('❌ Quiz submission API failed:', submitResponse.data.message);
          }
        } catch (error) {
          console.log('❌ Quiz submission API error:', error.message);
        }
        
      } else {
        console.log('⚠️  No courses with quizzes found. Create a course with quiz lectures first.');
      }
      
    } else {
      console.log('⚠️  No courses found. Create some courses first.');
    }
    
  } catch (error) {
    console.error('❌ Failed to test quiz endpoints:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on http://localhost:3500');
    }
  }
}

// Run the test
testQuizEndpoints().then(() => {
  console.log('\n🏁 Quiz API testing completed!');
}).catch((error) => {
  console.error('💥 Test failed:', error.message);
});