const S3 = require('aws-sdk/clients/s3');
const dotenv = require('dotenv');

dotenv.config();

// Add this line to disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Environment variables
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Create S3 instance
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// Upload file to S3
function uploadFile(file, path = '', source = 'public') {
  const fileBuffer = file.buffer;
  const validatedSource = source === 'private' || source === 'public' ? source : 'public';
  const fileWithPath =
    path !== ''
      ? `${validatedSource}/${path}/${file.originalname}`
      : `${validatedSource}/${file.originalname}`;

  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileWithPath,
  };

  return s3.upload(uploadParams).promise();
}

module.exports = { uploadFile };
