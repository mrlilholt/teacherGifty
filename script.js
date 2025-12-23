// script.js for Gifts for Teachers site
// Handles role selection, integrated search, and gift randomizer

document.addEventListener('DOMContentLoaded', () => {
  // Element references
  const parentBtn = document.getElementById('parent-btn');
  const studentBtn = document.getElementById('student-btn');
  const recommendationGrid = document.getElementById('recommendation-grid');
  const searchInput = document.getElementById('global-search-input');
  const searchResults = document.getElementById('search-results');
  const randomBtn = document.getElementById('random-btn');
  const priceSelect = document.getElementById('price-range');
  const randomResult = document.getElementById('random-result');
  const roleMessage = document.getElementById('role-message');

  /* Data for all gifts. Each entry includes:
     - title: the gift name
     - description: a short description to display
     - link: Amazon search URL with the giftsforteacher-20 tag
     - icon: FontAwesome icon class (without the fa-solid prefix)
     - recipient: who the gift is best suited for ("parent", "student" or "both")
     - price: price category ("2","5","10","15","20","above20") */
  const gifts = [
    { title: 'Thank‑You Cards & Notes', description: 'A heartfelt note or card lets a teacher know exactly how they made a difference. Include specific memories for extra impact.', link: 'https://www.amazon.com/s?k=teacher+thank+you+cards&tag=giftsforteacher-20', icon: 'fa-envelope', recipient: 'both', price: '10' },
    { title: 'Photo Book Kit', description: 'Collect classroom photos and create a keepsake album the whole class can sign and present together.', link: 'https://www.amazon.com/s?k=photo+book+kit&tag=giftsforteacher-20', icon: 'fa-book-open', recipient: 'both', price: '15' },
    { title: 'Audible Membership', description: 'Give the gift of audiobooks so teachers can enjoy stories or professional development on the go.', link: 'https://www.amazon.com/s?k=audible+membership&tag=giftsforteacher-20', icon: 'fa-headphones-simple', recipient: 'both', price: 'above20' },
    { title: 'Smart Speaker (Echo Dot)', description: 'A compact smart speaker plays music, sets timers and answers questions — handy for the classroom or relaxing at home.', link: 'https://www.amazon.com/s?k=echo+dot+smart+speaker&tag=giftsforteacher-20', icon: 'fa-microphone', recipient: 'both', price: 'above20' },
    { title: 'Cozy Socks', description: 'Treat them to ultra‑soft socks for lounging after a long day on their feet.', link: 'https://www.amazon.com/s?k=cozy+teacher+socks&tag=giftsforteacher-20', icon: 'fa-socks', recipient: 'both', price: '5' },
    { title: 'Personalized Teacher Stickers', description: 'Customized stickers for grading or decorating supplies are a fun way to celebrate their name or motto.', link: 'https://www.amazon.com/s?k=personalized+teacher+stickers&tag=giftsforteacher-20', icon: 'fa-sticky-note', recipient: 'student', price: '5' },
    { title: 'Teacher Hair Ties', description: 'Cute hair ties with teacher sayings make a lighthearted and practical token from students.', link: 'https://www.amazon.com/s?k=teacher+hair+ties&tag=giftsforteacher-20', icon: 'fa-ribbon', recipient: 'student', price: '5' },
    { title: 'Personalized Art Print', description: 'Commission or customize a print that includes the teacher’s name or a favorite quote for their wall.', link: 'https://www.amazon.com/s?k=personalized+teacher+art+print&tag=giftsforteacher-20', icon: 'fa-paint-brush', recipient: 'both', price: '15' },
    { title: 'Engraved Bookmark', description: 'A metal bookmark engraved with a sweet message or the teacher’s name makes a lasting keepsake.', link: 'https://www.amazon.com/s?k=teacher+metal+bookmark&tag=giftsforteacher-20', icon: 'fa-bookmark', recipient: 'both', price: '10' },
    { title: 'Pencils & Supplies Kit', description: 'Practical supplies like pre‑sharpened pencils, erasers and highlighters keep classrooms stocked and reduce out‑of‑pocket spending.', link: 'https://www.amazon.com/s?k=pre+sharpened+pencils+kit&tag=giftsforteacher-20', icon: 'fa-pencil-alt', recipient: 'parent', price: '10' },
    { title: 'Electric Pencil Sharpener', description: 'A reliable sharpener saves time and helps the whole class keep writing without interruption.', link: 'https://www.amazon.com/s?k=electric+pencil+sharpener&tag=giftsforteacher-20', icon: 'fa-bolt', recipient: 'parent', price: '20' },
    { title: 'Dry Erase Markers & Board', description: 'Bright markers and a sturdy board help teachers plan lessons and keep students engaged.', link: 'https://www.amazon.com/s?k=dry+erase+marker+set+for+teachers&tag=giftsforteacher-20', icon: 'fa-chalkboard', recipient: 'parent', price: '20' },
    { title: 'Organization Caddy', description: 'A divided caddy or rolling cart keeps supplies tidy and easy to transport around the classroom.', link: 'https://www.amazon.com/s?k=teacher+organization+caddy&tag=giftsforteacher-20', icon: 'fa-box', recipient: 'parent', price: '15' },
    { title: 'Amazon Gift Card', description: 'A gift card lets teachers choose exactly what they need or treat themselves to something special.', link: 'https://www.amazon.com/s?k=amazon+gift+card&tag=giftsforteacher-20', icon: 'fa-gift', recipient: 'both', price: 'above20' },
    { title: 'Coffee & Hot Chocolate Sampler', description: 'Gourmet coffee or cocoa packets stock the teachers\' lounge and provide a warm pick‑me‑up during breaks.', link: 'https://www.amazon.com/s?k=coffee+and+hot+chocolate+gift+set&tag=giftsforteacher-20', icon: 'fa-mug-hot', recipient: 'parent', price: '15' },
    { title: 'Candy Jar', description: 'Fill a jar with sweets and add a cute tag like “How sweet it is to be taught by you” for an easy, thoughtful gift.', link: 'https://www.amazon.com/s?k=candy+jar+teacher+gift&tag=giftsforteacher-20', icon: 'fa-candy-cane', recipient: 'both', price: '10' },
    { title: 'Aromatherapy & Candle Set', description: 'Help them unwind with a spa‑inspired set of candles, oils and lotions to reduce stress.', link: 'https://www.amazon.com/s?k=teacher+aromatherapy+candle+set&tag=giftsforteacher-20', icon: 'fa-spa', recipient: 'parent', price: '20' },
    { title: 'Funny Teacher Mug', description: 'A humorous mug with a punny saying adds a dose of laughter to their morning coffee.', link: 'https://www.amazon.com/s?k=funny+teacher+mug&tag=giftsforteacher-20', icon: 'fa-face-laugh', recipient: 'student', price: '10' },
    { title: 'Ornament', description: 'Celebrate the holidays with a charming ornament that reminds teachers how much they\'re appreciated.', link: 'https://www.amazon.com/s?k=teacher+ornament&tag=giftsforteacher-20', icon: 'fa-ornament', recipient: 'both', price: '10' },
    { title: 'Scented Candle', description: 'A warmly scented candle brings a cozy ambiance to their home or classroom.', link: 'https://www.amazon.com/s?k=scented+candle+gift+teacher&tag=giftsforteacher-20', icon: 'fa-candle-holder', recipient: 'both', price: '10' },
    { title: 'Cozy Throw Blanket', description: 'Soft blankets keep teachers snug during chilly evenings or while reading at home.', link: 'https://www.amazon.com/s?k=cozy+throw+blanket+teacher+gift&tag=giftsforteacher-20', icon: 'fa-blanket', recipient: 'both', price: '20' },
    { title: 'Holiday Mug', description: 'A festive mug brings seasonal cheer to their daily routine.', link: 'https://www.amazon.com/s?k=holiday+mug+teacher&tag=giftsforteacher-20', icon: 'fa-mug-hot', recipient: 'both', price: '10' },
    { title: 'Hot Cocoa Set', description: 'Delicious hot cocoa mixes warm the heart during winter months.', link: 'https://www.amazon.com/s?k=hot+cocoa+gift+set+teacher&tag=giftsforteacher-20', icon: 'fa-mug-hot', recipient: 'both', price: '10' },
    { title: 'Personalized Stocking', description: 'A stocking customized with their name makes a cute holiday surprise.', link: 'https://www.amazon.com/s?k=personalized+teacher+stocking&tag=giftsforteacher-20', icon: 'fa-socks', recipient: 'both', price: '20' },
    { title: 'Mini Succulent Plant', description: 'Easy‑care succulents add a bit of green to desks or windowsills.', link: 'https://www.amazon.com/s?k=mini+succulent+plant+gift&tag=giftsforteacher-20', icon: 'fa-seedling', recipient: 'both', price: '10' },
    { title: 'Spring Flower Bouquet', description: 'Bright spring flowers or bulbs bring color and life into the classroom.', link: 'https://www.amazon.com/s?k=spring+flower+bouquet+teacher&tag=giftsforteacher-20', icon: 'fa-seedling', recipient: 'both', price: '15' },
    { title: 'Inspirational Notebook', description: 'An uplifting notebook is perfect for lesson planning or journaling.', link: 'https://www.amazon.com/s?k=inspirational+notebook+teacher+gift&tag=giftsforteacher-20', icon: 'fa-book', recipient: 'both', price: '10' },
    { title: 'Keepsake Photo Frame', description: 'A decorative frame holds cherished memories from the school year.', link: 'https://www.amazon.com/s?k=teacher+photo+frame&tag=giftsforteacher-20', icon: 'fa-image', recipient: 'both', price: '15' },
    { title: 'Inspirational Quote Book', description: 'Motivational books inspire and encourage educators every day.', link: 'https://www.amazon.com/s?k=inspirational+quote+book+teacher&tag=giftsforteacher-20', icon: 'fa-book-open', recipient: 'both', price: '10' },
    { title: 'Memory Journal', description: 'A guided journal lets teachers capture reflections and meaningful moments.', link: 'https://www.amazon.com/s?k=memory+journal+teacher+gift&tag=giftsforteacher-20', icon: 'fa-book', recipient: 'both', price: '15' },
    { title: 'Spa Gift Card', description: 'Let them indulge in some well‑deserved pampering with a spa treatment.', link: 'https://www.amazon.com/s?k=spa+gift+card+teacher&tag=giftsforteacher-20', icon: 'fa-spa', recipient: 'both', price: 'above20' },
    { title: 'Celebration Gift Set', description: 'Celebrate milestones with a curated box of treats and keepsakes.', link: 'https://www.amazon.com/s?k=celebration+gift+set+teacher&tag=giftsforteacher-20', icon: 'fa-gifts', recipient: 'both', price: '15' },
    { title: 'Back‑to‑School Survival Kit', description: 'A collection of essentials like tissues, wipes and pens to kick off the school year right.', link: 'https://www.amazon.com/s?k=back+to+school+survival+kit+teacher&tag=giftsforteacher-20', icon: 'fa-school', recipient: 'parent', price: '20' },
    { title: 'Fun Pen Set', description: 'Colorful pens bring a little joy to grading and note‑taking.', link: 'https://www.amazon.com/s?k=fun+pen+set+teacher&tag=giftsforteacher-20', icon: 'fa-pen', recipient: 'parent', price: '10' },
    { title: 'Classroom Door Sign', description: 'A welcoming sign personalizes their classroom space.', link: 'https://www.amazon.com/s?k=teacher+classroom+door+sign&tag=giftsforteacher-20', icon: 'fa-door-open', recipient: 'parent', price: '15' },
    { title: 'Motivational Stamp Set', description: 'Stamps with encouraging words help praise student work.', link: 'https://www.amazon.com/s?k=motivational+stamp+set+teacher&tag=giftsforteacher-20', icon: 'fa-stamp', recipient: 'parent', price: '15' },
    { title: 'Spa Gift Basket', description: 'A basket of bath salts, lotions and candles offers a relaxing escape.', link: 'https://www.amazon.com/s?k=spa+gift+basket+teacher&tag=giftsforteacher-20', icon: 'fa-spa', recipient: 'both', price: '20' },
    { title: 'Flower Bouquet or Plant', description: 'Fresh flowers or potted plants brighten their classroom or home.', link: 'https://www.amazon.com/s?k=teacher+flower+bouquet&tag=giftsforteacher-20', icon: 'fa-seedling', recipient: 'both', price: '15' },
    { title: 'Group Card Kit', description: 'A collaborative card kit lets every student share a heartfelt message.', link: 'https://www.amazon.com/s?k=group+card+kit+teacher&tag=giftsforteacher-20', icon: 'fa-users', recipient: 'both', price: '10' },
    { title: 'Heart‑Shaped Chocolates', description: 'Sweet heart‑shaped chocolates show your appreciation on Valentine’s Day or any day.', link: 'https://www.amazon.com/s?k=heart+shaped+chocolates+teacher+gift&tag=giftsforteacher-20', icon: 'fa-heart', recipient: 'both', price: '10' },
    { title: 'Rose Bouquet', description: 'Elegant roses express gratitude and admiration.', link: 'https://www.amazon.com/s?k=rose+bouquet+teacher+gift&tag=giftsforteacher-20', icon: 'fa-rose', recipient: 'both', price: '15' },
    { title: 'Love‑Themed Mug', description: 'A mug adorned with loving motifs warms both hands and heart.', link: 'https://www.amazon.com/s?k=love+themed+mug+teacher&tag=giftsforteacher-20', icon: 'fa-mug-hot', recipient: 'both', price: '10' },
    { title: 'Heart Candle', description: 'A heart‑shaped candle creates a cozy ambiance.', link: 'https://www.amazon.com/s?k=heart+candle+teacher+gift&tag=giftsforteacher-20', icon: 'fa-candle-holder', recipient: 'both', price: '10' },
    { title: 'Pumpkin Decoration', description: 'A festive pumpkin decorates the classroom during fall.', link: 'https://www.amazon.com/s?k=pumpkin+decoration+teacher+gift&tag=giftsforteacher-20', icon: 'fa-pumpkin', recipient: 'both', price: '10' },
    { title: 'Autumn‑Scented Candle', description: 'Invite the scents of autumn with a warm, spiced candle.', link: 'https://www.amazon.com/s?k=autumn+scented+candle+teacher&tag=giftsforteacher-20', icon: 'fa-candle-holder', recipient: 'both', price: '10' },
    { title: 'Caramel Apple Gift Set', description: 'Juicy apples and sweet caramel make a delicious fall treat.', link: 'https://www.amazon.com/s?k=caramel+apple+gift+set+teacher&tag=giftsforteacher-20', icon: 'fa-apple-alt', recipient: 'both', price: '15' },
    { title: 'Novelty Socks', description: 'Fun socks with quirky patterns bring a smile to their face.', link: 'https://www.amazon.com/s?k=novelty+socks+teacher+gift&tag=giftsforteacher-20', icon: 'fa-socks', recipient: 'both', price: '5' },
    { title: 'Glue Sticks & Art Supplies', description: 'Glue sticks, crayons and markers fuel creative projects.', link: 'https://www.amazon.com/s?k=glue+sticks+art+supplies+teacher&tag=giftsforteacher-20', icon: 'fa-paint-brush', recipient: 'parent', price: '10' },
    { title: 'Stapler & Hole Punch', description: 'Staplers and punches keep paperwork organized and tidy.', link: 'https://www.amazon.com/s?k=stapler+and+hole+punch+teacher+gift&tag=giftsforteacher-20', icon: 'fa-stapler', recipient: 'parent', price: '15' },
    { title: 'Rolling Cart', description: 'A rolling cart helps transport books and supplies around the classroom.', link: 'https://www.amazon.com/s?k=rolling+cart+teacher+gift&tag=giftsforteacher-20', icon: 'fa-cart-flatbed-suitcase', recipient: 'parent', price: 'above20' },
    { title: 'Desk Organizer', description: 'Desk organizers corral pens, paperclips and small supplies.', link: 'https://www.amazon.com/s?k=desk+organizer+teacher+gift&tag=giftsforteacher-20', icon: 'fa-box-archive', recipient: 'parent', price: '20' },
    { title: 'Label Maker', description: 'A label maker keeps classrooms neat and clearly marked.', link: 'https://www.amazon.com/s?k=label+maker+teacher+gift&tag=giftsforteacher-20', icon: 'fa-barcode', recipient: 'parent', price: '20' },
    { title: 'Colorful File Folders', description: 'Bright folders help organize handouts and assignments.', link: 'https://www.amazon.com/s?k=colorful+file+folders+teacher+gift&tag=giftsforteacher-20', icon: 'fa-folder', recipient: 'parent', price: '10' },
    { title: 'Custom Teacher Stamp', description: 'A custom stamp adds a personal touch to graded work.', link: 'https://www.amazon.com/s?k=custom+teacher+stamp&tag=giftsforteacher-20', icon: 'fa-stamp', recipient: 'parent', price: '15' },
    { title: 'Monogrammed Tote Bag', description: 'A stylish tote bag monogrammed with their initials carries books and supplies.', link: 'https://www.amazon.com/s?k=monogrammed+tote+bag+teacher&tag=giftsforteacher-20', icon: 'fa-bag-shopping', recipient: 'parent', price: '20' },
    { title: 'Custom Notepad', description: 'A personalized notepad helps keep to‑do lists and reminders organized.', link: 'https://www.amazon.com/s?k=custom+teacher+notepad&tag=giftsforteacher-20', icon: 'fa-note-sticky', recipient: 'parent', price: '10' },
    { title: 'Lavender Eye Mask', description: 'Lavender‑scented eye masks relax and soothe tired eyes.', link: 'https://www.amazon.com/s?k=lavender+eye+mask+teacher+gift&tag=giftsforteacher-20', icon: 'fa-eye', recipient: 'both', price: '10' },
    { title: 'Bath Bomb Set', description: 'Fizzing bath bombs transform baths into spa‑like retreats.', link: 'https://www.amazon.com/s?k=bath+bomb+set+teacher&tag=giftsforteacher-20', icon: 'fa-bath', recipient: 'both', price: '10' },
    { title: 'Chocolate Gift Box', description: 'Assorted chocolates satisfy sweet cravings.', link: 'https://www.amazon.com/s?k=chocolate+gift+box+teacher&tag=giftsforteacher-20', icon: 'fa-box-open', recipient: 'both', price: '15' },
    { title: 'Fresh Fruit Basket', description: 'A fruit basket delivers a healthy snack assortment.', link: 'https://www.amazon.com/s?k=fresh+fruit+basket+teacher+gift&tag=giftsforteacher-20', icon: 'fa-apple-alt', recipient: 'both', price: '20' },
    { title: 'Starbucks or Coffee Card', description: 'A coffee shop gift card fuels caffeine breaks.', link: 'https://www.amazon.com/s?k=starbucks+gift+card+teacher&tag=giftsforteacher-20', icon: 'fa-mug-saucer', recipient: 'both', price: '10' },
    { title: 'Target or Department Store Card', description: 'A department store card lets them pick what they need most.', link: 'https://www.amazon.com/s?k=target+gift+card+teacher&tag=giftsforteacher-20', icon: 'fa-store', recipient: 'both', price: '20' },
    { title: 'Visa Gift Card', description: 'A Visa gift card offers ultimate flexibility for any purchase.', link: 'https://www.amazon.com/s?k=visa+gift+card&tag=giftsforteacher-20', icon: 'fa-credit-card', recipient: 'both', price: 'above20' },
    { title: 'Class Apron or T‑Shirt', description: 'Aprons or T‑shirts featuring student signatures make heartfelt keepsakes.', link: 'https://www.amazon.com/s?k=class+apron+teacher+gift&tag=giftsforteacher-20', icon: 'fa-shirt', recipient: 'both', price: '20' },
    { title: 'Memory Jar', description: 'A jar filled with notes from students preserves special memories.', link: 'https://www.amazon.com/s?k=memory+jar+teacher+gift&tag=giftsforteacher-20', icon: 'fa-jar', recipient: 'both', price: '10' },
    { title: 'Inspirational Quote Sign', description: 'A decorative sign with an inspiring quote reminds teachers of their impact.', link: 'https://www.amazon.com/s?k=inspirational+quote+sign+teacher&tag=giftsforteacher-20', icon: 'fa-quote-right', recipient: 'both', price: '15' },
    { title: 'Punny Teacher T‑Shirt', description: 'A punny shirt brings humor to the classroom wardrobe.', link: 'https://www.amazon.com/s?k=punny+teacher+t+shirt&tag=giftsforteacher-20', icon: 'fa-shirt', recipient: 'student', price: '15' },
    { title: 'Quirky Desk Sign', description: 'A funny desk sign adds personality to their desk.', link: 'https://www.amazon.com/s?k=quirky+desk+sign+teacher&tag=giftsforteacher-20', icon: 'fa-sign-hanging', recipient: 'student', price: '10' }
  ];

  // Currently selected role for filtering; default is to show all gifts
  let selectedRole = 'all';

  // Filter items displayed in the featured recommendations grid based on role
  function filterByRole(role) {
    if (!recommendationGrid) return;
    const items = recommendationGrid.querySelectorAll('.product-item');
    items.forEach(item => {
      const target = item.getAttribute('data-recipient');
      if (role === 'all' || target === 'both' || target === role) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
    selectedRole = role;

    // Update the role message text based on selection
    if (roleMessage) {
      if (role === 'parent') {
        roleMessage.textContent = "You're wonderful for supporting your teacher. Let's find something perfect.";
        roleMessage.style.display = 'block';
      } else if (role === 'student') {
        roleMessage.textContent = "It's very thoughtful of you to give your teacher a gift. Let me help you find something perfect.";
        roleMessage.style.display = 'block';
      } else {
        roleMessage.style.display = 'none';
      }
    }
  }

  // Attach role button handlers
  if (parentBtn) {
    parentBtn.addEventListener('click', () => filterByRole('parent'));
  }
  if (studentBtn) {
    studentBtn.addEventListener('click', () => filterByRole('student'));
  }

  // Helper to build a gift card DOM element from a gift object
  function createGiftCard(gift) {
    const card = document.createElement('div');
    card.classList.add('product-item');
    const iconEl = document.createElement('i');
    iconEl.classList.add('fa-solid', gift.icon);
    const contentEl = document.createElement('div');
    contentEl.classList.add('product-item-content');
    const titleEl = document.createElement('h3');
    titleEl.textContent = gift.title;
    const descEl = document.createElement('p');
    descEl.textContent = gift.description;
    const linkEl = document.createElement('a');
    linkEl.href = gift.link;
    linkEl.target = '_blank';
    linkEl.textContent = 'Shop on Amazon';
    contentEl.appendChild(titleEl);
    contentEl.appendChild(descEl);
    contentEl.appendChild(linkEl);
    card.appendChild(iconEl);
    card.appendChild(contentEl);
    return card;
  }

  // Quick search function for the hero search bar
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      if (query) {
        searchResults.innerHTML = '';
        const matches = gifts.filter(gift => {
          const inRole = selectedRole === 'all' || gift.recipient === 'both' || gift.recipient === selectedRole;
          return inRole && (gift.title.toLowerCase().includes(query) || gift.description.toLowerCase().includes(query));
        });
        matches.forEach(gift => {
          const card = createGiftCard(gift);
          searchResults.appendChild(card);
        });
        searchResults.style.display = 'grid';
        if (recommendationGrid) recommendationGrid.style.display = 'none';
      } else {
        // Clear prior results and hide results container
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        // Restore the recommendation grid to its default display (flex) instead of forcing a grid layout
        if (recommendationGrid) recommendationGrid.style.display = '';
      }
    });
  }

  // Random gift selector using price range and role
  if (randomBtn && priceSelect && randomResult) {
    randomBtn.addEventListener('click', () => {
      const selected = priceSelect.value;
      const priceMap = {
        '2': ['2'],
        '5': ['2','5'],
        '10': ['2','5','10'],
        '15': ['2','5','10','15'],
        '20': ['2','5','10','15','20'],
        'above20': ['above20']
      };
      const allowed = priceMap[selected] || [];
      const candidates = gifts.filter(gift => {
        const inPrice = allowed.includes(gift.price);
        const inRole = selectedRole === 'all' || gift.recipient === 'both' || gift.recipient === selectedRole;
        return inPrice && inRole;
      });
      randomResult.innerHTML = '';
      if (candidates.length === 0) {
        const msg = document.createElement('p');
        msg.textContent = 'No gifts found for this price range.';
        randomResult.appendChild(msg);
        return;
      }
      const randomGift = candidates[Math.floor(Math.random() * candidates.length)];
      const card = createGiftCard(randomGift);
      randomResult.appendChild(card);
    });
  }

  // Page-level search for holiday/type pages
  const pageSearchInputs = document.querySelectorAll('.page-search-input');
  pageSearchInputs.forEach(input => {
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      const grid = input.parentElement.querySelector('.product-grid');
      if (!grid) return;
      const items = grid.querySelectorAll('.product-item');
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (!query || text.includes(query)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Continuous horizontal scrolling for product grids (marquee style)
  const grids = document.querySelectorAll('.product-grid');
  grids.forEach(grid => {
    // Clone all children to allow seamless looping
    const children = Array.from(grid.children);
    children.forEach(child => {
      const clone = child.cloneNode(true);
      clone.classList.add('cloned');
      grid.appendChild(clone);
    });
    // Auto scroll variables
    const scrollStep = 1; // pixels per tick
    const delay = 20; // ms between scrolls
    setInterval(() => {
      if (!grid || grid.scrollWidth <= grid.clientWidth) return;
      grid.scrollLeft += scrollStep;
      // When we've scrolled past the original set of items, reset to start
      if (grid.scrollLeft >= grid.scrollWidth / 2) {
        grid.scrollLeft = 0;
      }
    }, delay);
  });
});