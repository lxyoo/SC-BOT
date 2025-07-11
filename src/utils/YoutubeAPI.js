const ytsr = require('youtube-search-api');

class YouTubeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey; // Not actually used by youtube-search-api, but keeping for compatibility
    console.log('✅ YouTube API initialized (using youtube-search-api)');
  }

  async searchVideos(query, maxResults = 5) {
    try {
      console.log(`🔍 Searching for: ${query}`);
      const results = await ytsr.GetListByKeyword(query, false, maxResults);

      if (!results.items || results.items.length === 0) {
        console.log('❌ No results found');
        return [];
      }
      
      console.log(`✅ Found ${results.items.length} results`);
      
      return results.items.map(item => ({
        id: item.id,
        title: item.title,
        channel: item.channelTitle || 'Unknown Channel',
        thumbnail: item.thumbnail?.thumbnails?.[0]?.url || 'https://via.placeholder.com/120x90',
        url: `https://www.youtube.com/watch?v=${item.id}`,
        description: item.description || '',
        duration: item.length?.simpleText || 'Unknown',
        views: item.viewCount?.simpleText || 'Unknown views',
        uploadDate: item.publishedTimeText?.simpleText || 'Unknown date'
      }));
    } catch (error) {
      console.error('YouTube Search Error:', error);
      
      // Handle specific error cases
      if (error.message.includes('429')) {
        throw new Error('YouTube rate limit exceeded - try again later');
      } else if (error.message.includes('blocked')) {
        throw new Error('YouTube blocked the request - try using SoundCloud instead');
      } else {
        throw new Error(`YouTube Search Error: ${error.message}`);
      }
    }
  }

  async getVideoDetails(videoId) {
    try {
      console.log(`🔍 Getting details for video: ${videoId}`);
      const video = await ytsr.GetVideoDetails(videoId);
      
      if (!video) {
        throw new Error('Video not found');
      }
      
      return {
        id: video.id,
        title: video.title,
        channel: video.channelTitle || 'Unknown Channel',
        thumbnail: video.thumbnail?.thumbnails?.[0]?.url || 'https://via.placeholder.com/120x90',
        url: `https://www.youtube.com/watch?v=${video.id}`,
        description: video.description || '',
        duration: video.lengthSeconds ? this.formatDuration(video.lengthSeconds) : 'Unknown',
        views: video.viewCount || 'Unknown views',
        uploadDate: video.publishDate || 'Unknown date'
      };
    } catch (error) {
      console.error('YouTube API Error:', error);
      throw new Error(`YouTube API Error: ${error.message}`);
    }
  }

  // Helper function to format duration
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  // Test connection method
  async testConnection() {
    try {
      console.log('🔍 Testing YouTube search connection...');
      const results = await this.searchVideos('test', 1);
      
      if (results.length > 0) {
        console.log('✅ YouTube search connection successful!');
        return true;
      } else {
        console.log('⚠️ YouTube search returned no results');
        return false;
      }
    } catch (error) {
      console.error('❌ YouTube search connection failed:', error.message);
      return false;
    }
  }
}

module.exports = YouTubeAPI;