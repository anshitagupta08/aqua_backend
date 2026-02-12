// const { Router } = require('express');
// const { asyncHandler } = require('../../utils/asyncHandler');
// const {
//   getAuthToken,
//   initiateCall,
//   mockIncomingCall,
//   IncomingCall,
//   postCallData,
//   sseIncomingCallStream,
//   IframeContent,
//   EndCall,
//   Event,
// } = require('../../controllers/Calling/callingController');

// const router = Router();

// router.post('/get-auth-token', asyncHandler(getAuthToken));
// router.post('/initiate-call', asyncHandler(initiateCall));

// router.get('/mock-incoming-call', asyncHandler(mockIncomingCall));

// router.get('/iframe-content', asyncHandler(IframeContent));

// // web-hooks
// router.post('/incoming/event', asyncHandler(IncomingCall));
// router.post('/post-call-data', asyncHandler(postCallData));

// router.post('/webhook/call-end', EndCall);
// router.post('/webhook/event', Event);

// router.get('/incoming-call-stream', asyncHandler(sseIncomingCallStream)); // Frontend will connect here

// module.exports = router;
