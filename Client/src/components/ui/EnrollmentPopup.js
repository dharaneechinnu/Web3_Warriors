import React from 'react';

const EnrollmentPopup = ({ course, onConfirm, onCancel }) => {
  if (!course) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Enroll in {course.title}</h2>
        <p>The enrollment cost is {course.price} tokens.</p>
        <p>This will be deducted from your wallet.</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="mr-4 px-4 py-2 rounded bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(course)}
            className="px-4 py-2 rounded bg-blue-500 text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPopup;
