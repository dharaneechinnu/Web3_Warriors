const fs       = require('fs');
const path     = require('path');
const pdfParse = require('pdf-parse');

/**
 * Parse a PDF resume from a local disk path and return extracted text.
 * @param {string} localPath - Path relative to process.cwd() (e.g. "uploads/resumes/resume_xxx.pdf")
 * @returns {Promise<string>} Extracted plain text, or empty string on failure.
 */
const parseResumeFromPath = async (localPath) => {
  try {
    const absolutePath = path.isAbsolute(localPath)
      ? localPath
      : path.join(process.cwd(), localPath);

    const buffer = fs.readFileSync(absolutePath);
    const data   = await pdfParse(buffer);
    return (data.text || '').trim();
  } catch (err) {
    console.error('[resumeParser] Parse error (local path):', err.message);
    return '';
  }
};

/**
 * Parse a PDF resume by downloading it from a public URL.
 * Used as a fallback when the local path is unavailable.
 * @param {string} url - Public URL to the PDF file.
 * @returns {Promise<string>} Extracted plain text, or empty string on failure.
 */
const parseResumeFromUrl = async (url) => {
  try {
    const axios    = require('axios');
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer   = Buffer.from(response.data);
    const data     = await pdfParse(buffer);
    return (data.text || '').trim();
  } catch (err) {
    console.error('[resumeParser] Parse error (URL):', err.message);
    return '';
  }
};

module.exports = { parseResumeFromPath, parseResumeFromUrl };
