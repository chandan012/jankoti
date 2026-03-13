const express = require('express');
const router = express.Router();
const axios = require('axios');
const Podcast = require('../models/Podcast');
const { auth, requireOrganization } = require('../middleware/auth');
const { createImageUpload, deleteImage } = require('../config/cloudinary');

const uploadPodcastImage = createImageUpload('podcasts');

const extractMetaContent = (html, keys) => {
  if (!html) return null;
  const keyList = Array.isArray(keys) ? keys : [keys];
  const keySet = new Set(keyList.map((key) => key.toLowerCase()));
  const metaTags = html.match(/<meta\s+[^>]*>/gi) || [];

  for (const tag of metaTags) {
    const attrs = {};
    tag.replace(/([a-zA-Z:_-]+)\s*=\s*["']([^"']*)["']/g, (_, name, value) => {
      attrs[name.toLowerCase()] = value;
      return '';
    });
    const key = (attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    if (keySet.has(key) && attrs.content) {
      return attrs.content.trim();
    }
  }

  return null;
};

const extractLinkHref = (html, rels) => {
  if (!html) return null;
  const relList = Array.isArray(rels) ? rels : [rels];
  const relSet = new Set(relList.map((rel) => rel.toLowerCase()));
  const linkTags = html.match(/<link\s+[^>]*>/gi) || [];

  for (const tag of linkTags) {
    const attrs = {};
    tag.replace(/([a-zA-Z:_-]+)\s*=\s*["']([^"']*)["']/g, (_, name, value) => {
      attrs[name.toLowerCase()] = value;
      return '';
    });
    const rel = (attrs.rel || '').toLowerCase();
    if (relSet.has(rel) && attrs.href) {
      return attrs.href.trim();
    }
  }

  return null;
};

const extractRssImage = (xml) => {
  if (!xml) return null;
  const itunesMatch = xml.match(/<itunes:image[^>]+href=["']([^"']+)["']/i);
  if (itunesMatch) {
    return itunesMatch[1].trim();
  }
  const channelImage = xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>[\s\S]*?<\/image>/i);
  if (channelImage) {
    return channelImage[1].trim();
  }
  return null;
};

const normalizeLink = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const resolveUrl = (maybeUrl, baseUrl) => {
  try {
    return new URL(maybeUrl, baseUrl).toString();
  } catch (error) {
    return maybeUrl;
  }
};

const getYouTubeId = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || null;
    }
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com') || host.includes('m.youtube.com')) {
      const vParam = parsed.searchParams.get('v');
      if (vParam) return vParam;
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'shorts' && pathParts[1]) return pathParts[1];
      if (pathParts[0] === 'embed' && pathParts[1]) return pathParts[1];
      if (pathParts[0] === 'live' && pathParts[1]) return pathParts[1];
    }
  } catch (error) {
    return null;
  }
  return null;
};

const resolvePodcastCover = async (episodeLink) => {
  const normalizedLink = normalizeLink(episodeLink);
  if (!normalizedLink) return '';

  const youtubeId = getYouTubeId(normalizedLink);
  if (youtubeId) {
    return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  const trySpotifyOembed = async (url) => {
    try {
      const response = await axios.get('https://open.spotify.com/oembed', {
        params: { url },
        timeout: 4000
      });
      if (response.data?.thumbnail_url) {
        return response.data.thumbnail_url;
      }
    } catch (error) {
      return '';
    }
    return '';
  };

  const tryAppleOembed = async (url) => {
    try {
      const response = await axios.get('https://embed.podcasts.apple.com/oembed', {
        params: { url },
        timeout: 4000
      });
      if (response.data?.thumbnail_url) {
        return response.data.thumbnail_url;
      }
    } catch (error) {
      try {
        const fallback = await axios.get('https://itunes.apple.com/oembed', {
          params: { url },
          timeout: 4000
        });
        if (fallback.data?.thumbnail_url) {
          return fallback.data.thumbnail_url;
        }
      } catch (innerError) {
        return '';
      }
    }
    return '';
  };

  const tryYouTubeOembed = async (url) => {
    try {
      const response = await axios.get('https://www.youtube.com/oembed', {
        params: { url, format: 'json' },
        timeout: 4000
      });
      if (response.data?.thumbnail_url) {
        return response.data.thumbnail_url;
      }
    } catch (error) {
      return '';
    }
    return '';
  };

  const tryNoEmbed = async (url) => {
    try {
      const response = await axios.get('https://noembed.com/embed', {
        params: { url },
        timeout: 4000
      });
      if (response.data?.thumbnail_url) {
        return response.data.thumbnail_url;
      }
    } catch (error) {
      return '';
    }
    return '';
  };

  if (normalizedLink.includes('open.spotify.com')) {
    const cover = await trySpotifyOembed(normalizedLink);
    if (cover) return cover;
  }

  if (normalizedLink.includes('apple.com') || normalizedLink.includes('podcasts.apple.com')) {
    const cover = await tryAppleOembed(normalizedLink);
    if (cover) return cover;
  }

  if (normalizedLink.includes('youtube.com') || normalizedLink.includes('youtu.be')) {
    const cover = await tryYouTubeOembed(normalizedLink);
    if (cover) return cover;
  }

  const noEmbedCover = await tryNoEmbed(normalizedLink);
  if (noEmbedCover) return noEmbedCover;

  try {
    const response = await axios.get(normalizedLink, {
      timeout: 5000,
      maxContentLength: 2 * 1024 * 1024,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PodcastCover/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });

    const html = typeof response.data === 'string' ? response.data : '';
    const finalUrl = response.request?.res?.responseUrl || normalizedLink;

    if (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) {
      const cover = await tryYouTubeOembed(finalUrl);
      if (cover) return cover;
    }

    if (finalUrl.includes('open.spotify.com')) {
      const cover = await trySpotifyOembed(finalUrl);
      if (cover) return cover;
    }

    if (finalUrl.includes('apple.com') || finalUrl.includes('podcasts.apple.com')) {
      const cover = await tryAppleOembed(finalUrl);
      if (cover) return cover;
    }

    if (/xml|rss/i.test(response.headers['content-type'] || '') || html.includes('<rss') || html.includes('<feed')) {
      const rssImage = extractRssImage(html);
      if (rssImage) return resolveUrl(rssImage, finalUrl);
    }

    const ogImage = extractMetaContent(html, [
      'og:image',
      'og:image:secure_url',
      'twitter:image',
      'twitter:image:src',
      'image'
    ]);

    if (ogImage) {
      return resolveUrl(ogImage, finalUrl);
    }

    const linkImage = extractLinkHref(html, ['image_src', 'apple-touch-icon', 'icon']);
    if (linkImage) {
      return resolveUrl(linkImage, finalUrl);
    }
  } catch (error) {
    return '';
  }

  return '';
};

const ensureCoverImage = async (podcast) => {
  if (!podcast || podcast.coverImageUrl || !podcast.episodeLink) {
    return podcast;
  }

  const cover = await resolvePodcastCover(podcast.episodeLink);
  if (cover) {
    podcast.coverImageUrl = cover;
    try {
      await podcast.save();
    } catch (error) {
      // ignore save errors to avoid blocking responses
    }
  }
  return podcast;
};

// Get all podcast postings
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10, search } = req.query;
    
    const query = { status };
    if (search) {
      query.$text = { $search: search };
    }
    
    const podcasts = await Podcast.find(query)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    await Promise.all(podcasts.map((podcast) => ensureCoverImage(podcast)));
      
    const total = await Podcast.countDocuments(query);
    
    res.json({
      podcasts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's own podcast postings
router.get('/my-podcasts', auth, requireOrganization, async (req, res) => {
  try {
    const filter = req.isAdmin ? {} : { postedBy: req.userId };
    const podcasts = await Podcast.find(filter)
      .populate('postedBy', 'name email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ podcasts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single podcast by ID
router.get('/:id', async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id)
      .populate('postedBy', 'name email profilePicture');
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast posting not found' });
    }
    
    // Increment views
    podcast.views += 1;
    await podcast.save();

    await ensureCoverImage(podcast);
    
    res.json({ podcast });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Podcast posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Create new podcast posting
router.post('/', auth, requireOrganization, uploadPodcastImage, async (req, res) => {
  try {
    let coverImageUrl = '';
    let coverImagePublicId = '';
    if (req.file) {
      coverImageUrl = req.file.path;
      coverImagePublicId = req.file.filename;
    } else {
      coverImageUrl = await resolvePodcastCover(req.body.episodeLink);
    }

    const podcast = new Podcast({
      ...req.body,
      coverImageUrl,
      coverImagePublicId,
      postedBy: req.userId
    });
    
    const savedPodcast = await podcast.save();
    
    res.status(201).json({
      message: 'Podcast posting created successfully',
      podcast: savedPodcast
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update podcast posting
router.put('/:id', auth, requireOrganization, uploadPodcastImage, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && podcast.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this posting' });
    }
    
    const updateData = { ...req.body, updatedAt: Date.now() };

    let oldCoverPublicId = null;
    if (req.file) {
      oldCoverPublicId = podcast.coverImagePublicId;
      updateData.coverImageUrl = req.file.path;
      updateData.coverImagePublicId = req.file.filename;
    } else if (req.body.episodeLink && !podcast.coverImagePublicId) {
      updateData.coverImageUrl = await resolvePodcastCover(req.body.episodeLink);
    }

    const updatedPodcast = await Podcast.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (oldCoverPublicId) {
      await deleteImage(oldCoverPublicId);
    }
    
    res.json({
      message: 'Podcast posting updated successfully',
      podcast: updatedPodcast
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Podcast posting not found' });
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete podcast posting
router.delete('/:id', auth, requireOrganization, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast posting not found' });
    }
    
    // Check ownership
    if (!req.isAdmin && podcast.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this posting' });
    }
    
    await Podcast.findByIdAndDelete(req.params.id);
    if (podcast.coverImagePublicId) {
      await deleteImage(podcast.coverImagePublicId);
    }
    
    res.json({ message: 'Podcast posting deleted successfully' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Podcast posting not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
