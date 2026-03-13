/**
 * Social Media Service - Enhanced Version
 * Handles posting jobs to LinkedIn and Instagram with comprehensive OAuth support
 */

const axios = require('axios');
require('dotenv').config();

// LinkedIn API Configuration
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

// Environment variables
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';


// NOTE: In production, use a database (MongoDB, PostgreSQL, Redis)
// This is for development/demo purposes only

const tokenStore = {
  tokens: new Map(),
  
  save(userId, tokenData) {
    this.tokens.set(userId, {
      ...tokenData,
      savedAt: Date.now()
    });
    console.log(`✓ LinkedIn token saved for user: ${userId}`);
  },
  
  get(userId) {
    const data = this.tokens.get(userId);
    if (!data) return null;
    
    // Check if token is expired
    if (data.expiresAt && Date.now() > data.expiresAt) {
      console.log(`⚠ LinkedIn token expired for user: ${userId}`);
      this.delete(userId);
      return null;
    }
    
    return data;
  },
  
  delete(userId) {
    this.tokens.delete(userId);
    console.log(`✓ LinkedIn token deleted for user: ${userId}`);
  },
  
  exists(userId) {
    return this.tokens.has(userId) && this.get(userId) !== null;
  }
};



/**
 * Generate a random state string for CSRF protection
 */
const generateState = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Format job data into a LinkedIn post with professional formatting
 * @param {Object} jobData - Job posting data
 * @returns {string} Formatted LinkedIn post text
 */
const formatLinkedInPost = (jobData) => {
  const { title, company, location, jobType, salary, description, requirements, experience } = jobData;
  
  let postText = `🎯 We're Hiring: ${title}\n\n`;
  postText += `${company} is looking for talented individuals to join our team!\n\n`;
  
  // Add job details
  const details = [];
  if (location) details.push(`📍 Location: ${location}`);
  if (jobType) details.push(`💼 Type: ${jobType}`);
  if (salary) details.push(`💰 Salary: ${salary}`);
  if (experience) details.push(`💪 Experience: ${experience}`);
  
  if (details.length > 0) {
    postText += details.join('\n') + '\n\n';
  }
  
  // Add description (truncated)
  const maxDescLength = 250;
  const truncatedDesc = description && description.length > maxDescLength 
    ? description.substring(0, maxDescLength) + '...' 
    : description || '';
  postText += `${truncatedDesc}\n\n`;
  
  // Add requirements (first 3)
  if (requirements && requirements.length > 0) {
    postText += 'Key Requirements:\n';
    const reqToShow = requirements.filter(r => r && r.trim()).slice(0, 3);
    reqToShow.forEach(req => {
      postText += `✓ ${req}\n`;
    });
    postText += '\n';
  }
  
  // Add hashtags
  postText += '#hiring #jobs #career #opportunities #nowhiring';
  
  // LinkedIn has a 3000 character limit, so we truncate at 2900 for safety
  return postText.substring(0, 2900);
};

/**
 * Validate job data before posting
 * @param {Object} jobData - Job posting data to validate
 * @returns {Object} Validation result with isValid and errors array
 */
const validateJobData = (jobData) => {
  const errors = [];
  
  if (!jobData.title || jobData.title.trim().length < 3) {
    errors.push('Job title must be at least 3 characters');
  }
  
  if (!jobData.company || jobData.company.trim().length < 2) {
    errors.push('Company name must be at least 2 characters');
  }
  
  if (!jobData.description || jobData.description.trim().length < 10) {
    errors.push('Job description must be at least 10 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};



/**
 * Generate LinkedIn OAuth URL with state parameter for CSRF protection
 * @returns {string} LinkedIn OAuth authorization URL
 */
const getLinkedInAuthUrl = (userId = null) => {
  // Generate a random state for CSRF protection
  const randomState = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  // If userId is provided, encode it in the state (userId|RANDOM_STATE)
  const state = userId ? `${userId}|${randomState}` : randomState;
  
  // Extended scope for posting and email access
  const scopes = ['profile', 'email', 'openid', 'w_member_social'].join(' ');
  
  const url = `${LINKEDIN_AUTH_URL}/authorization?` +
    `response_type=code&` +
    `client_id=${LINKEDIN_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&` +
    `state=${state}&` +
    `scope=${encodeURIComponent(scopes)}`;
  
  console.log('🔐 Generated LinkedIn OAuth URL');
  return url;
};

/**
 * Exchange LinkedIn authorization code for access token
 * @param {string} code - Authorization code from LinkedIn callback
 * @returns {Object} Token result with success status and token data or error
 */
const getLinkedInAccessToken = async (code) => {
  try {
    console.log('📥 Exchanging authorization code for access token');
    
    const response = await axios.post(
      `${LINKEDIN_AUTH_URL}/accessToken`,
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code: code,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
          redirect_uri: LINKEDIN_REDIRECT_URI
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in, refresh_token } = response.data;
    console.log('✓ Access token received');
    
    return {
      success: true,
      accessToken: access_token,
      expiresIn: expires_in,
      refreshToken: refresh_token
    };
  } catch (error) {
    console.error('❌ LinkedIn token exchange error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    
    return {
      success: false,
      error: error.response?.data?.error_description || 
             error.response?.data?.error || 
             'Failed to exchange LinkedIn authorization code'
    };
  }
};

/**
 * Get LinkedIn user profile with email
 * @param {string} accessToken - LinkedIn access token
 * @returns {Object} Profile result with user data or error
 */
const getLinkedInProfile = async (accessToken) => {
  try {
    console.log('📥 Fetching LinkedIn user profile');
    
    const response = await axios.get(LINKEDIN_USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const { sub: userId, name, email, picture } = response.data;
    console.log('✓ Profile fetched successfully');
    console.log('User ID:', userId);
    
    return {
      success: true,
      userId: userId,
      name: name,
      email: email,
      picture: picture
    };
  } catch (error) {
    console.error('❌ LinkedIn profile fetch error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 
             error.response?.data?.error || 
             'Failed to get LinkedIn profile'
    };
  }
};

/**
 * Get LinkedIn user profile (Lite profile without email)
 * @param {string} accessToken - LinkedIn access token
 * @returns {Object} Profile result with user data or error
 */
const getLinkedInLiteProfile = async (accessToken) => {
  try {
    console.log('📥 Fetching LinkedIn lite profile');
    
    const response = await axios.get(`${LINKEDIN_API_BASE}/me?projection=(id,localizedFirstName,localizedLastName)`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✓ Lite profile fetched successfully');
    
    return {
      success: true,
      userId: response.data.id,
      name: `${response.data.localizedFirstName} ${response.data.localizedLastName}`
    };
  } catch (error) {
    console.error('❌ LinkedIn lite profile error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'Failed to get LinkedIn profile'
    };
  }
};



/**
 * Post a job to LinkedIn
 * @param {string} accessToken - LinkedIn access token
 * @param {string} userId - LinkedIn user ID (optional, will fetch if missing)
 * @param {Object} job - Job posting data
 * @param {string} imageUrl - Optional image URL for the post
 * @returns {Object} Post result with success status and post data or error
 */
const postToLinkedIn = async (accessToken, userId, job, imageUrl = null) => {
  try {
    console.log('📤 Posting job to LinkedIn');
    console.log('User ID:', userId);
    console.log('Job:', job.title);
    
    // Fallback: If userId is not provided, fetch it from LinkedIn API
    if (!userId) {
      console.log('⚠️ No userId provided, fetching from LinkedIn API...');
      const profileResult = await getLinkedInLiteProfile(accessToken);
      if (profileResult.success) {
        userId = profileResult.userId;
        console.log('✓ Fetched userId from API:', userId);
      } else {
        return {
          success: false,
          error: 'Could not fetch LinkedIn user ID. Please reconnect your LinkedIn account.',
          requiresReauth: true
        };
      }
    }
    
    // Format the post text
    const postText = formatLinkedInPost(job);
    
    // Create LinkedIn UGC Post
    const ugcPost = {
      author: `urn:li:person:${userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: postText
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post(`${LINKEDIN_API_BASE}/ugcPosts`, ugcPost, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    console.log('✓ Job posted to LinkedIn successfully');
    console.log('Post ID:', response.data.id);
    
    return {
      success: true,
      postId: response.data.id,
      postUrl: `https://www.linkedin.com/feed/update/${response.data.id}`
    };
  } catch (error) {
    console.error('❌ LinkedIn posting error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    
    // Handle specific LinkedIn API errors
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'LinkedIn authentication expired. Please reconnect your LinkedIn account.',
        requiresReauth: true
      };
    }
    
    if (error.response?.status === 429) {
      return {
        success: false,
        error: 'LinkedIn API rate limit exceeded. Please try again later.',
        rateLimited: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || 
             error.response?.data?.error || 
             error.message || 
             'Failed to post to LinkedIn'
    };
  }
};

/**
 * Save LinkedIn token to in-memory store
 * @param {string} userId - Local user ID
 * @param {Object} tokenData - Token data to save
 */
const saveLinkedInToken = (userId, tokenData) => {
  tokenStore.save(userId, tokenData);
};

/**
 * Get LinkedIn token from in-memory store
 * @param {string} userId - Local user ID
 * @returns {Object|null} Token data or null if not found/expired
 */
const getLinkedInToken = (userId) => {
  return tokenStore.get(userId);
};

/**
 * Delete LinkedIn token from in-memory store
 * @param {string} userId - Local user ID
 */
const deleteLinkedInToken = (userId) => {
  tokenStore.delete(userId);
};

/**
 * Check if LinkedIn token exists and is valid
 * @param {string} userId - Local user ID
 * @returns {boolean} True if token exists and is valid
 */
const hasLinkedInToken = (userId) => {
  return tokenStore.exists(userId);
};

// ============================================
// INSTAGRAM FUNCTIONS (Existing)
// ============================================

/**
 * Generate Instagram OAuth URL
 * @returns {string} Instagram OAuth authorization URL
 */
const getInstagramAuthUrl = () => {
  const scopes = ['user_profile', 'user_media'].join(',');
  const state = Math.random().toString(36).substring(2, 15);
  
  return `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}&scope=${scopes}&response_type=code&state=${state}`;
};

/**
 * Exchange Instagram authorization code for access token
 * @param {string} code - Authorization code from Instagram callback
 * @returns {Object} Token result with success status or error
 */
const getInstagramAccessToken = async (code) => {
  try {
    const response = await axios.get(`https://api.instagram.com/oauth/access_token`, {
      params: {
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code: code
      }
    });

    return {
      success: true,
      accessToken: response.data.access_token,
      userId: response.data.user_id
    };
  } catch (error) {
    console.error('Instagram token error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error_message || 'Failed to exchange Instagram token'
    };
  }
};

/**
 * Get Instagram user profile
 * @param {string} accessToken - Instagram access token
 * @returns {Object} Profile result with user data or error
 */
const getInstagramProfile = async (accessToken) => {
  try {
    const response = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields: 'id,username,account_type',
        access_token: accessToken
      }
    });

    return {
      success: true,
      userId: response.data.id,
      username: response.data.username
    };
  } catch (error) {
    console.error('Instagram profile error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to get Instagram profile'
    };
  }
};

/**
 * Post to Instagram
 * @param {string} accessToken - Instagram access token
 * @param {string} userId - Instagram user ID
 * @param {Object} job - Job posting data
 * @param {string} imageUrl - Image URL for the post
 * @returns {Object} Post result with success status or error
 */
const postToInstagram = async (accessToken, userId, job, imageUrl = null) => {
  try {
    if (!imageUrl) {
      return {
        success: false,
        error: 'Instagram posts require an image. Please generate an AI banner first.'
      };
    }

    const caption = `🚀 WE'RE HIRING! 🚀\n\n📌 ${job.title}\n🏢 ${job.company}\n📍 ${job.location}\n\nApply now!`;

    // Create media container
    const createMediaResponse = await axios.post(`https://graph.facebook.com/v18.0/${userId}/media`, {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken
    });

    // Publish the media
    const publishResponse = await axios.post(`https://graph.facebook.com/v18.0/${createMediaResponse.data.id}/publish`, {
      access_token: accessToken
    });

    return {
      success: true,
      postId: publishResponse.data.id,
      postUrl: `https://www.instagram.com/p/${publishResponse.data.id}`
    };
  } catch (error) {
    console.error('Instagram post error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to post to Instagram'
    };
  }
};

// ============================================
// CONFIGURATION CHECKS
// ============================================

/**
 * Check if LinkedIn is properly configured
 * @returns {boolean} True if all required environment variables are set
 */
const isLinkedInConfigured = () => {
  return !!(LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET && LINKEDIN_REDIRECT_URI);
};

/**
 * Check if Instagram is properly configured
 * @returns {boolean} True if all required environment variables are set
 */
const isInstagramConfigured = () => {
  return !!(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET && process.env.INSTAGRAM_REDIRECT_URI);
};

/**
 * Get LinkedIn configuration status
 * @returns {Object} Configuration status with details
 */
const getLinkedInConfigStatus = () => {
  return {
    configured: isLinkedInConfigured(),
    clientId: !!LINKEDIN_CLIENT_ID,
    clientSecret: !!LINKEDIN_CLIENT_SECRET,
    redirectUri: !!LINKEDIN_REDIRECT_URI
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // LinkedIn OAuth & Auth
  getLinkedInAuthUrl,
  getLinkedInAccessToken,
  getLinkedInProfile,
  getLinkedInLiteProfile,
  
  // LinkedIn Token Management (In-Memory)
  saveLinkedInToken,
  getLinkedInToken,
  deleteLinkedInToken,
  hasLinkedInToken,
  
  // LinkedIn Posting
  postToLinkedIn,
  formatLinkedInPost,
  validateJobData,
  
  // Instagram
  getInstagramAuthUrl,
  getInstagramAccessToken,
  getInstagramProfile,
  postToInstagram,
  
  // Configuration Checks
  isLinkedInConfigured,
  isInstagramConfigured,
  getLinkedInConfigStatus,
  
  // Utility
  generateState
};
