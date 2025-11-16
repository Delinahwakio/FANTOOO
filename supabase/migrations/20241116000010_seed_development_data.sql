-- Migration: Seed Development Data
-- Description: Seeds initial data for development including credit packages, 
--              fictional profiles, and operator specializations
-- Requirements: 3.1-3.5 (Fictional Profiles), 5.1-5.5 (Credit System)

-- =====================================================
-- SEED CREDIT PACKAGES
-- =====================================================
-- Create standard credit packages with various pricing tiers
-- Requirement 5.1-5.5: Credit System

INSERT INTO credit_packages (
  name,
  credits,
  price,
  currency,
  is_featured,
  badge_text,
  discount_percentage,
  bonus_credits,
  is_active,
  variant
) VALUES
  -- Starter Package
  (
    'Starter Pack',
    10,
    100.00,
    'KES',
    false,
    NULL,
    0,
    0,
    true,
    'starter'
  ),
  -- Popular Package (Featured)
  (
    'Popular Pack',
    50,
    450.00,
    'KES',
    true,
    'POPULAR',
    10,
    5,
    true,
    'popular'
  ),
  -- Value Package
  (
    'Value Pack',
    100,
    850.00,
    'KES',
    false,
    NULL,
    15,
    15,
    true,
    'value'
  ),
  -- Best Value Package (Featured)
  (
    'Premium Pack',
    500,
    4000.00,
    'KES',
    true,
    'BEST VALUE',
    20,
    100,
    true,
    'premium'
  );

-- =====================================================
-- SEED FICTIONAL PROFILES
-- =====================================================
-- Create diverse fictional profiles for development and testing
-- Requirement 3.1-3.5: Fictional Profiles

INSERT INTO fictional_users (
  name,
  age,
  gender,
  location,
  bio,
  personality_traits,
  interests,
  occupation,
  education,
  relationship_status,
  profile_pictures,
  response_style,
  response_templates,
  personality_guidelines,
  is_active,
  is_featured,
  tags,
  category,
  popularity_score
) VALUES
  -- Profile 1: Amara (Featured)
  (
    'Amara',
    25,
    'female',
    'Nairobi, Kenya',
    'Adventure seeker and coffee enthusiast. I believe life is too short for boring conversations. Let''s talk about dreams, travel, and everything in between! 🌍✨',
    ARRAY['adventurous', 'optimistic', 'spontaneous', 'warm'],
    ARRAY['travel', 'photography', 'coffee', 'hiking', 'music festivals'],
    'Travel Blogger',
    'Bachelor''s in Communications',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1'
    ],
    'flirty',
    '{
      "greeting": "Hey there! 😊 What adventure are you planning next?",
      "compliment": "You have such an interesting perspective! Tell me more...",
      "question": "If you could travel anywhere right now, where would you go?",
      "goodbye": "This was fun! Let''s chat again soon! ✨"
    }'::jsonb,
    'Amara is outgoing, flirty, and loves to make people feel special. She uses emojis frequently and asks engaging questions about travel and life experiences. Keep responses upbeat and playful.',
    true,
    true,
    ARRAY['adventurous', 'travel', 'outgoing', 'flirty'],
    'lifestyle',
    95
  ),
  
  -- Profile 2: Zuri
  (
    'Zuri',
    28,
    'female',
    'Mombasa, Kenya',
    'Beach lover and yoga instructor. Finding peace in the little things. Let''s share positive vibes and good energy! 🧘‍♀️🌊',
    ARRAY['calm', 'spiritual', 'caring', 'mindful'],
    ARRAY['yoga', 'meditation', 'beach walks', 'healthy cooking', 'reading'],
    'Yoga Instructor',
    'Certified Yoga Teacher',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453'
    ],
    'friendly',
    '{
      "greeting": "Namaste! 🙏 How are you feeling today?",
      "compliment": "Your energy is so positive! I love that about you.",
      "question": "What brings you peace and happiness?",
      "goodbye": "Stay blessed and keep shining! ✨"
    }'::jsonb,
    'Zuri is calm, spiritual, and nurturing. She focuses on wellness, mindfulness, and positive energy. Use calming language and show genuine interest in emotional well-being.',
    true,
    false,
    ARRAY['wellness', 'spiritual', 'beach', 'calm'],
    'lifestyle',
    78
  ),
  
  -- Profile 3: Imani
  (
    'Imani',
    26,
    'female',
    'Nairobi, Kenya',
    'Tech enthusiast and gamer girl. I code by day and game by night. Looking for someone who can keep up with my wit and my K/D ratio! 🎮💻',
    ARRAY['intelligent', 'witty', 'competitive', 'nerdy'],
    ARRAY['gaming', 'coding', 'anime', 'tech gadgets', 'esports'],
    'Software Developer',
    'Bachelor''s in Computer Science',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df',
      'https://images.unsplash.com/photo-1496440737103-cd596325d314'
    ],
    'playful',
    '{
      "greeting": "Hey! Ready to level up this conversation? 🎮",
      "compliment": "Nice! You''ve got good taste!",
      "question": "What''s your favorite game right now?",
      "goodbye": "GG! Let''s party up again soon!"
    }'::jsonb,
    'Imani is smart, playful, and loves gaming/tech culture. She uses gaming terminology and references. Keep conversations fun and intellectually stimulating.',
    true,
    false,
    ARRAY['tech', 'gaming', 'intelligent', 'playful'],
    'tech',
    82
  ),
  
  -- Profile 4: Nia
  (
    'Nia',
    24,
    'female',
    'Kisumu, Kenya',
    'Artist and dreamer. I paint emotions and capture moments. Life is my canvas, and I''m always looking for new inspiration! 🎨✨',
    ARRAY['creative', 'sensitive', 'romantic', 'expressive'],
    ARRAY['painting', 'art galleries', 'poetry', 'indie music', 'vintage fashion'],
    'Visual Artist',
    'Bachelor''s in Fine Arts',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6',
      'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6'
    ],
    'romantic',
    '{
      "greeting": "Hello beautiful soul! What colors your world today? 🎨",
      "compliment": "You have such a beautiful way of seeing things...",
      "question": "What inspires you?",
      "goodbye": "Until we meet again in this beautiful chaos... 💫"
    }'::jsonb,
    'Nia is artistic, romantic, and deeply emotional. She speaks poetically and appreciates beauty in everything. Use creative language and show appreciation for art and emotions.',
    true,
    false,
    ARRAY['artistic', 'romantic', 'creative', 'sensitive'],
    'arts',
    71
  ),
  
  -- Profile 5: Makena (Featured)
  (
    'Makena',
    27,
    'female',
    'Nairobi, Kenya',
    'Fitness enthusiast and nutrition coach. Strong body, strong mind! Let''s motivate each other to be our best selves! 💪🏃‍♀️',
    ARRAY['motivated', 'disciplined', 'energetic', 'supportive'],
    ARRAY['fitness', 'nutrition', 'running', 'meal prep', 'motivational speaking'],
    'Fitness Coach',
    'Certified Personal Trainer',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f',
      'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11'
    ],
    'friendly',
    '{
      "greeting": "Hey champion! Ready to crush your goals today? 💪",
      "compliment": "You''re doing amazing! Keep pushing!",
      "question": "What''s your fitness goal right now?",
      "goodbye": "Stay strong and keep grinding! You''ve got this!"
    }'::jsonb,
    'Makena is energetic, motivational, and supportive. She encourages healthy lifestyle choices and uses fitness terminology. Keep conversations uplifting and goal-oriented.',
    true,
    true,
    ARRAY['fitness', 'motivated', 'health', 'energetic'],
    'fitness',
    88
  ),
  
  -- Profile 6: Aaliyah
  (
    'Aaliyah',
    29,
    'female',
    'Nairobi, Kenya',
    'Fashion designer and style maven. Life is too short to wear boring clothes! Let''s talk fashion, trends, and everything fabulous! 👗✨',
    ARRAY['stylish', 'confident', 'trendy', 'sophisticated'],
    ARRAY['fashion design', 'shopping', 'runway shows', 'photography', 'travel'],
    'Fashion Designer',
    'Bachelor''s in Fashion Design',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
      'https://images.unsplash.com/photo-1506863530036-1efeddceb993'
    ],
    'flirty',
    '{
      "greeting": "Darling! How fabulous are you today? 💋",
      "compliment": "You have impeccable taste!",
      "question": "What''s your signature style?",
      "goodbye": "Stay fabulous, darling! Ciao! 💕"
    }'::jsonb,
    'Aaliyah is confident, stylish, and sophisticated. She loves fashion and uses trendy language. Keep conversations chic and engaging with fashion references.',
    true,
    false,
    ARRAY['fashion', 'stylish', 'confident', 'trendy'],
    'fashion',
    76
  ),
  
  -- Profile 7: Safiya
  (
    'Safiya',
    23,
    'female',
    'Eldoret, Kenya',
    'Bookworm and aspiring writer. Lost in stories and creating my own. Let''s discuss books, movies, and the magic of storytelling! 📚✍️',
    ARRAY['intellectual', 'imaginative', 'thoughtful', 'curious'],
    ARRAY['reading', 'writing', 'movies', 'coffee shops', 'book clubs'],
    'Content Writer',
    'Bachelor''s in Literature',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4',
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea'
    ],
    'intellectual',
    '{
      "greeting": "Hello! What story are you living today? 📖",
      "compliment": "You have such an interesting perspective on things!",
      "question": "What''s the last book that changed your thinking?",
      "goodbye": "May your story be filled with beautiful chapters! ✨"
    }'::jsonb,
    'Safiya is intellectual, thoughtful, and loves deep conversations. She references books and stories. Keep conversations meaningful and thought-provoking.',
    true,
    false,
    ARRAY['intellectual', 'books', 'writing', 'thoughtful'],
    'arts',
    69
  ),
  
  -- Profile 8: Thandiwe
  (
    'Thandiwe',
    26,
    'female',
    'Nakuru, Kenya',
    'Foodie and chef extraordinaire! I believe the way to anyone''s heart is through amazing food. Let''s share recipes and culinary adventures! 🍳👨‍🍳',
    ARRAY['passionate', 'creative', 'warm', 'generous'],
    ARRAY['cooking', 'baking', 'food photography', 'wine tasting', 'farmers markets'],
    'Chef',
    'Culinary Arts Diploma',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1485893086445-ed75865251e0',
      'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e'
    ],
    'friendly',
    '{
      "greeting": "Hey there! Hungry for good conversation? 😊",
      "compliment": "You have great taste!",
      "question": "What''s your favorite comfort food?",
      "goodbye": "Stay delicious! Let''s cook up more conversations soon! 🍽️"
    }'::jsonb,
    'Thandiwe is warm, passionate about food, and loves sharing culinary experiences. Use food metaphors and show enthusiasm for cooking and eating.',
    true,
    false,
    ARRAY['foodie', 'cooking', 'creative', 'warm'],
    'lifestyle',
    73
  ),
  
  -- Profile 9: Kamaria
  (
    'Kamaria',
    30,
    'female',
    'Nairobi, Kenya',
    'Entrepreneur and business strategist. Building empires and breaking glass ceilings. Let''s talk ambition, success, and making moves! 💼🚀',
    ARRAY['ambitious', 'confident', 'strategic', 'driven'],
    ARRAY['entrepreneurship', 'networking', 'investing', 'public speaking', 'mentoring'],
    'Business Consultant',
    'MBA',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f'
    ],
    'intellectual',
    '{
      "greeting": "Hello! Ready to talk about big ideas? 💡",
      "compliment": "I love your entrepreneurial spirit!",
      "question": "What''s your biggest goal right now?",
      "goodbye": "Keep hustling! Success is waiting for you! 🚀"
    }'::jsonb,
    'Kamaria is ambitious, business-minded, and motivational. She talks about success, goals, and entrepreneurship. Keep conversations inspiring and goal-focused.',
    true,
    false,
    ARRAY['business', 'ambitious', 'entrepreneur', 'confident'],
    'business',
    80
  ),
  
  -- Profile 10: Leilani
  (
    'Leilani',
    25,
    'female',
    'Mombasa, Kenya',
    'Music lover and aspiring DJ. Life needs a soundtrack! Let''s vibe to good music and create unforgettable memories! 🎵🎧',
    ARRAY['fun', 'energetic', 'social', 'creative'],
    ARRAY['music', 'DJing', 'concerts', 'dancing', 'nightlife'],
    'DJ & Music Producer',
    'Audio Engineering Certificate',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9'
    ],
    'playful',
    '{
      "greeting": "Yo! What''s your vibe today? 🎵",
      "compliment": "You''ve got great energy!",
      "question": "What song is stuck in your head right now?",
      "goodbye": "Keep the good vibes flowing! Peace! ✌️"
    }'::jsonb,
    'Leilani is energetic, fun, and loves music culture. She uses music references and slang. Keep conversations upbeat and party-focused.',
    true,
    false,
    ARRAY['music', 'party', 'energetic', 'social'],
    'entertainment',
    75
  ),
  
  -- Profile 11: Ayana
  (
    'Ayana',
    27,
    'female',
    'Nairobi, Kenya',
    'Environmental activist and nature lover. Saving the planet one conversation at a time. Let''s talk sustainability and making a difference! 🌱🌍',
    ARRAY['passionate', 'caring', 'informed', 'idealistic'],
    ARRAY['environmental conservation', 'hiking', 'gardening', 'documentaries', 'volunteering'],
    'Environmental Scientist',
    'Master''s in Environmental Science',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    ],
    'friendly',
    '{
      "greeting": "Hello eco-warrior! How are you making a difference today? 🌱",
      "compliment": "I love your awareness and compassion!",
      "question": "What''s your take on sustainability?",
      "goodbye": "Keep fighting the good fight! Our planet needs you! 🌍"
    }'::jsonb,
    'Ayana is passionate about the environment and social causes. She''s informed and caring. Keep conversations meaningful and focused on making positive change.',
    true,
    false,
    ARRAY['environmental', 'activist', 'caring', 'nature'],
    'lifestyle',
    68
  ),
  
  -- Profile 12: Zara
  (
    'Zara',
    24,
    'female',
    'Nairobi, Kenya',
    'Social media influencer and content creator. Living life one post at a time! Let''s create content and capture moments! 📸✨',
    ARRAY['outgoing', 'trendy', 'creative', 'social'],
    ARRAY['content creation', 'photography', 'social media', 'fashion', 'travel'],
    'Content Creator',
    'Bachelor''s in Digital Marketing',
    'single',
    ARRAY[
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df',
      'https://images.unsplash.com/photo-1496440737103-cd596325d314',
      'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3'
    ],
    'flirty',
    '{
      "greeting": "Hey babe! Ready for your close-up? 📸",
      "compliment": "You''re totally Insta-worthy!",
      "question": "What''s your aesthetic?",
      "goodbye": "Stay gorgeous! Don''t forget to tag me! 💕"
    }'::jsonb,
    'Zara is trendy, social media savvy, and loves attention. She uses influencer language and emojis. Keep conversations fun and visually focused.',
    true,
    false,
    ARRAY['influencer', 'social', 'trendy', 'creative'],
    'entertainment',
    84
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE credit_packages IS 'Seeded with 4 standard packages: 10, 50, 100, 500 credits';
COMMENT ON TABLE fictional_users IS 'Seeded with 12 diverse fictional profiles for development';

