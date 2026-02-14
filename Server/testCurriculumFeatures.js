// Test script for quiz, assignment, and article functionality
// Run this with: node testCurriculumFeatures.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3500/courses';

// Test data
const testCourseId = '6763d6e30e5e4b2a9c87654321'; // Replace with actual course ID
const mentorId = '6763d6e30e5e4b2a9c12345678'; // Replace with actual mentor ID

const testQuiz = {
    title: "JavaScript Fundamentals Quiz",
    description: "Test your understanding of basic JavaScript concepts",
    timeLimitMinutes: 15,
    passingScore: 80,
    attemptsAllowed: 2,
    tokenReward: 10,
    questions: [
        {
            question: "What is the correct way to declare a variable in JavaScript?",
            type: "single_correct",
            choices: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
            correctIndex: 0,
            marks: 2
        },
        {
            question: "Which of the following are valid JavaScript data types?",
            type: "multiple_correct",
            choices: ["string", "number", "boolean", "integer", "object"],
            correctIndices: [0, 1, 2, 4],
            marks: 3
        },
        {
            question: "Explain the difference between 'let' and 'var' in JavaScript.",
            type: "short_answer",
            sampleAnswer: "let has block scope while var has function scope. let prevents hoisting issues and redeclaration in the same scope.",
            marks: 5
        }
    ]
};

const testAssignment = {
    description: "Create a JavaScript calculator application",
    instructions: "Build a calculator that can perform basic arithmetic operations (addition, subtraction, multiplication, division). Include error handling for division by zero. Submit your code as a .js file.",
    submissionType: "file",
    maxFileSize: "5MB",
    maxScore: 100,
    allowedFileTypes: ["js", "html", "css", "zip"]
};

const testArticle = {
    content: `# Introduction to JavaScript Variables

JavaScript variables are containers for storing data values. In this article, we'll explore the different ways to declare variables and their characteristics.

## Variable Declaration Methods

### 1. var
The traditional way to declare variables in JavaScript:
\`\`\`javascript
var name = "John";
var age = 30;
\`\`\`

### 2. let
Introduced in ES6, provides block scope:
\`\`\`javascript
let city = "New York";
let population = 8000000;
\`\`\`

### 3. const
For declaring constants that shouldn't be reassigned:
\`\`\`javascript
const PI = 3.14159;
const API_URL = "https://api.example.com";
\`\`\`

## Key Differences

| Declaration | Scope | Hoisting | Reassignment |
|-------------|--------|----------|--------------|
| var | Function | Yes | Yes |
| let | Block | No | Yes |
| const | Block | No | No |

Understanding these differences is crucial for writing reliable JavaScript code.`,
    readingTime: "8 min"
};

const testCurriculum = {
    courseId: testCourseId,
    mentorId: mentorId,
    sections: [
        {
            order: 1,
            title: "JavaScript Basics",
            description: "Introduction to JavaScript programming",
            lectures: [
                {
                    order: 1,
                    title: "What is JavaScript?",
                    type: "article",
                    content: testArticle.content,
                    readingTime: testArticle.readingTime
                },
                {
                    order: 2,
                    title: "Variables and Data Types",
                    type: "video",
                    videoUrl: "/uploads/videos/variables-tutorial.mp4",
                    duration: "15:30"
                },
                {
                    order: 3,
                    title: "JavaScript Quiz",
                    type: "quiz",
                    quiz: testQuiz
                },
                {
                    order: 4,
                    title: "Calculator Project",
                    type: "assignment",
                    assignment: testAssignment
                }
            ]
        }
    ]
};

// Test functions
async function testSaveCurriculum() {
    console.log('\n🧪 Testing Save Curriculum...');
    try {
        const response = await axios.post(`${BASE_URL}/save-curriculum`, testCurriculum);
        console.log('✅ Curriculum saved successfully:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Error saving curriculum:', error.response?.data || error.message);
        return false;
    }
}

async function testAddQuiz() {
    console.log('\n🧪 Testing Add Quiz to Lecture...');
    try {
        const response = await axios.post(`${BASE_URL}/add-quiz`, {
            courseId: testCourseId,
            sectionIndex: 0,
            lectureIndex: 2,
            quiz: testQuiz
        });
        console.log('✅ Quiz added successfully:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Error adding quiz:', error.response?.data || error.message);
        return false;
    }
}

async function testAddAssignment() {
    console.log('\n🧪 Testing Add Assignment to Lecture...');
    try {
        const response = await axios.post(`${BASE_URL}/add-assignment`, {
            courseId: testCourseId,
            sectionIndex: 0,
            lectureIndex: 3,
            assignment: testAssignment
        });
        console.log('✅ Assignment added successfully:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Error adding assignment:', error.response?.data || error.message);
        return false;
    }
}

async function testUpdateArticle() {
    console.log('\n🧪 Testing Update Article Content...');
    try {
        const response = await axios.post(`${BASE_URL}/update-article`, {
            courseId: testCourseId,
            sectionIndex: 0,
            lectureIndex: 0,
            content: testArticle.content,
            readingTime: testArticle.readingTime
        });
        console.log('✅ Article updated successfully:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Error updating article:', error.response?.data || error.message);
        return false;
    }
}

async function testGetQuizData() {
    console.log('\n🧪 Testing Get Quiz Data...');
    try {
        const response = await axios.get(`${BASE_URL}/${testCourseId}/section/0/lecture/2/quiz`);
        console.log('✅ Quiz data retrieved successfully:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error getting quiz data:', error.response?.data || error.message);
        return false;
    }
}

async function testGetAssignmentData() {
    console.log('\n🧪 Testing Get Assignment Data...');
    try {
        const response = await axios.get(`${BASE_URL}/${testCourseId}/section/0/lecture/3/assignment`);
        console.log('✅ Assignment data retrieved successfully:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error getting assignment data:', error.response?.data || error.message);
        return false;
    }
}

async function testGetArticleData() {
    console.log('\n🧪 Testing Get Article Data...');
    try {
        const response = await axios.get(`${BASE_URL}/${testCourseId}/section/0/lecture/0/article`);
        console.log('✅ Article data retrieved successfully:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Error getting article data:', error.response?.data || error.message);
        return false;
    }
}

async function testGetCourseWithCurriculum() {
    console.log('\n🧪 Testing Get Course with Curriculum...');
    try {
        const response = await axios.get(`${BASE_URL}/${testCourseId}`);
        console.log('✅ Course with curriculum retrieved successfully');
        console.log('📚 Number of sections:', response.data.curriculum?.sections?.length || 0);
        if (response.data.curriculum?.sections) {
            response.data.curriculum.sections.forEach((section, sIndex) => {
                console.log(`📖 Section ${sIndex + 1}: ${section.title} (${section.lectures?.length || 0} lectures)`);
                section.lectures?.forEach((lecture, lIndex) => {
                    console.log(`  📝 Lecture ${lIndex + 1}: ${lecture.title} (${lecture.type})`);
                    if (lecture.type === 'quiz' && lecture.quiz) {
                        console.log(`    🧩 Quiz: ${lecture.quiz.questions?.length || 0} questions`);
                    }
                    if (lecture.type === 'assignment' && lecture.assignment) {
                        console.log(`    📋 Assignment: ${lecture.assignment.description?.substring(0, 50)}...`);
                    }
                    if (lecture.type === 'article' && lecture.content) {
                        console.log(`    📄 Article: ${lecture.content?.substring(0, 50)}...`);
                    }
                });
            });
        }
        return true;
    } catch (error) {
        console.error('❌ Error getting course:', error.response?.data || error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Quiz, Assignment, and Article Tests...');
    console.log('📝 Note: Make sure to update testCourseId and mentorId with actual values');
    
    const results = {
        saveCurriculum: await testSaveCurriculum(),
        addQuiz: await testAddQuiz(),
        addAssignment: await testAddAssignment(),
        updateArticle: await testUpdateArticle(),
        getQuiz: await testGetQuizData(),
        getAssignment: await testGetAssignmentData(),
        getArticle: await testGetArticleData(),
        getCourse: await testGetCourseWithCurriculum()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('═══════════════════════');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Quiz, assignment, and article storage is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the error messages above.');
    }
}

// Export for use as module
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    testSaveCurriculum,
    testAddQuiz,
    testAddAssignment,
    testUpdateArticle,
    testGetQuizData,
    testGetAssignmentData,
    testGetArticleData,
    testGetCourseWithCurriculum
};