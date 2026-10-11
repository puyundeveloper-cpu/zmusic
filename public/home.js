var Home = {
    activeCategory: null,
    loadingCategory: false,
    categories: [
        { name: 'Semua' },
        { name: 'Chill', icon: 'coffee' },
        { name: 'Focus', icon: 'brain' },
        { name: 'Commute', icon: 'car' },
        { name: 'Gaming', icon: 'gamepad-2' },
        { name: 'Energize', icon: 'zap' },
        { name: 'Party', icon: 'party-popper' },
        { name: 'Feel good', icon: 'smile' },
        { name: 'Romance', icon: 'heart' },
        { name: 'Workout', icon: 'dumbbell' },
        { name: 'Sleep', icon: 'moon' },
        { name: 'Sad', icon: 'cloud-rain' },
        { name: 'Happy', icon: 'sun' },
        { name: 'Nostalgia', icon: 'disc' },
        { name: 'Acoustic', icon: 'guitar' },
        { name: 'Pop', icon: 'music' },
        { name: 'Rock', icon: 'flame' }
    ],

    render() {
        gid('view-home').innerHTML = `
        <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all" style="background: linear-gradient(180deg, rgba(8, 9, 13, 0.4) 0%, rgba(8, 9, 13, 0.75) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h1 class="text-3xl font-black text-white tracking-tight drop-shadow-md">ZMusic</h1>
                </div>
                <div class="flex items-center gap-2.5">
                    <button onclick="App.switch('search')" class="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 active:scale-95 transition-all shadow-lg" title="Cari">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="px-4 mt-4" id="home-main-content">
            <div id="home-default-view">
                <div class="space-y-6">
                    <div>
                        <h2 class="text-lg font-bold text-white mb-3 tracking-wide flex items-center gap-2.5">
                            <i data-lucide="zap" class="w-5 h-5 text-amber-400 fill-amber-400/20"></i>
                            <span>Quick Picks</span>
                        </h2>
                        <div id="home-grid" class="grid grid-cols-2 md:grid-cols-4 gap-3"></div>
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white mb-3 tracking-wide flex items-center gap-2.5">
                            <i data-lucide="disc" class="w-5 h-5 text-purple-400"></i>
                            <span>Playlists</span>
                        </h2>
                        <div id="home-scroll" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div>
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white mb-3 tracking-wide flex items-center gap-2.5">
                            <i data-lucide="users" class="w-5 h-5 text-rose-400"></i>
                            <span>Top Artists</span>
                        </h2>
                        <div id="home-artists" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div>
                    </div>
                </div>
            </div>
            <div id="home-category-view" style="display:none;"></div>
            <div id="home-all-categories" class="space-y-8 pb-8"></div>
        </div>`;

        lucide.createIcons();

        {
            var defView = gid('home-default-view'), catView = gid('home-category-view');
            if (defView) defView.style.display = 'block';
            if (catView) catView.style.display = 'none';
            if (S.ht && S.ht.length > 0) {
                Home.show();
            } else {
                Home.showSkeleton();
                Home.fetch();
            }
        }
    },

    selectCategory(catName) {
        if (!catName || catName === 'Semua') {
            Home.activeCategory = null;
            var defView = gid('home-default-view'), catView = gid('home-category-view');
            if (defView) defView.style.display = 'block';
            if (catView) catView.style.display = 'none';
            var all = gid('home-all-categories');
            if (all) all.style.display = 'block';
            var top = gid('home-main-content');
            if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (window.lucide) lucide.createIcons();
            return;
        }
        var target = gid('home-category-' + catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    async loadAllCategories() {
        var wrap = gid('home-all-categories');
        if (!wrap || wrap.dataset.loaded === '1') return;
        wrap.dataset.loaded = '1';

        var cats = Home.categories.filter(function(c) { return c.name !== 'Semua'; });
        wrap.innerHTML = cats.map(function(c) {
            var id = 'home-category-' + c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return '<section id="' + id + '" class="scroll-mt-28">' +
                '<div class="flex items-center justify-between mb-3">' +
                '<h2 class="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="' + (c.icon || 'music') + '" class="w-5 h-5"></i><span>' + es(c.name) + '</span></h2>' +
                '</div><div class="category-section-grid flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-1 px-1" data-category="' + es(c.name) + '">' +
                '<div class="col-span-full py-8 text-center text-white/50 text-xs animate-pulse">Memuat ' + es(c.name) + '...</div></div>' +
                '</section>';
        }).join('');
        if (window.lucide) lucide.createIcons();

        await Promise.all(cats.map(async function(c) {
            try {
                var query = c.name + ' Music';
                if (c.name === 'Acoustic') query = 'Acoustic Songs Hits';
                else if (c.name === 'Chill') query = 'Chill Vibes Lofi Songs';
                else if (c.name === 'Focus') query = 'Focus Deep Work Music';
                else if (c.name === 'Commute') query = 'Driving Roadtrip Music';
                else if (c.name === 'Gaming') query = 'Gaming EDM Hype Songs';
                else if (c.name === 'Energize') query = 'Energetic Workout Beats';
                else if (c.name === 'Party') query = 'Party Dance Hits';
                else if (c.name === 'Feel good') query = 'Feel Good Happy Songs';
                else if (c.name === 'Romance') query = 'Romantic Love Songs';
                else if (c.name === 'Workout') query = 'Gym Workout Motivation Music';
                else if (c.name === 'Sleep') query = 'Sleeping Calming Relaxation Music';
                else if (c.name === 'Sad') query = 'Sad Melancholic Songs';
                else if (c.name === 'Happy') query = 'Upbeat Happy Songs';
                else if (c.name === 'Nostalgia') query = '2000s Hits Nostalgia Songs';

                var r = await fetch(API.search + '?query=' + encodeURIComponent(query) + '&type=all');
                var d = await r.json();
                var songs = d && d.status && d.result && d.result.songs ? d.result.songs.slice(0, 8) : [];
                var id = 'home-category-' + c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                var section = gid(id);
                var grid = section ? section.querySelector('.category-section-grid') : null;
                if (!grid) return;

                if (!songs.length) {
                    grid.innerHTML = '<div class="py-8 text-center text-white/50 text-xs w-full">Tidak ada lagu ditemukan.</div>';
                    return;
                }
                grid.innerHTML = songs.map(function(t, i) {
                    var vid = t.videoId || t.id || '';
                    var cover = toHDCover(t.thumbnail, vid);
                    return '<div onclick="Home.playAllCategoryTrack(' + JSON.stringify(vid) + ', ' + JSON.stringify(c.name) + ')" class="group flex-shrink-0 w-40 sm:w-44 cursor-pointer active:scale-95 transition-all">' +
                        '<div class="p-2.5 rounded-2xl bg-[#20222c] border border-white/10 shadow-xl group-hover:bg-[#282b38] transition-all">' +
                        '<div class="w-full aspect-square rounded-xl overflow-hidden relative shadow-md mb-2.5">' +
                        '<img src="' + cover + '" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src=\'' + FI + '\'" />' +
                        '<div class="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"><i data-lucide="play" class="w-4 h-4 fill-current ml-0.5"></i></div>' +
                        '</div>' +
                        '<h3 class="font-semibold text-sm text-white truncate">' + es(cn(t.title || 'Untitled')) + '</h3>' +
                        '<p class="text-white/60 text-xs truncate mt-0.5">' + es(cn(t.artist || 'Unknown Artist')) + '</p>' +
                        '</div></div>';
                }).join('');
                if (window.lucide) lucide.createIcons();
            } catch (e) {
                var id = 'home-category-' + c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                var section = gid(id);
                var grid = section ? section.querySelector('.category-section-grid') : null;
                if (grid) grid.innerHTML = '<div class="py-8 text-center text-white/50 text-xs w-full">Gagal memuat kategori.</div>';
            }
        }));
    },

    playAllCategoryTrack(videoId, categoryName) {
        if (!videoId) return;
        fetch(API.search + '?query=' + encodeURIComponent('https://youtube.com/watch?v=' + videoId))
            .then(function(r){ return r.json(); })
            .then(function(d){
                var song = d && d.status && d.result && d.result.songs && d.result.songs[0];
                if (song && typeof playTrack === 'function') {
                    playTrack(song);
                } else if (typeof PK === 'function') {
                    S.hc = d && d.result && d.result.songs ? d.result.songs : [];
                    PK('homecat', 0);
                }
            }).catch(function(){});
    },

    async fetchCategoryData(catName) {
        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'none';
        if (catView) {
            catView.style.display = 'block';
            catView.innerHTML = `
            <div class="mb-4 flex justify-between items-center bg-white/5 p-3.5 rounded-2xl border border-white/10 animate-pulse">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-[#a0a5b0]">Kategori:</span>
                    <span class="font-bold text-sm text-white">${es(catName)}</span>
                </div>
                <button onclick="Home.selectCategory('Semua')" class="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#b3b3b3] hover:text-white transition-all flex items-center gap-1">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i> Reset
                </button>
            </div>
            <div class="text-center py-12">
                <div class="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p class="text-xs text-[#a0a5b0] animate-pulse">Memuat musik ${es(catName)}...</p>
            </div>`;
            lucide.createIcons();
        }

        var query = catName + ' Music';
        if (catName === 'Acoustic') query = 'Acoustic Songs Hits';
        else if (catName === 'Chill') query = 'Chill Vibes Lofi Songs';
        else if (catName === 'Focus') query = 'Focus Deep Work Music';
        else if (catName === 'Commute') query = 'Driving Roadtrip Music';
        else if (catName === 'Gaming') query = 'Gaming EDM Hype Songs';
        else if (catName === 'Energize') query = 'Energetic Workout Beats';
        else if (catName === 'Party') query = 'Party Dance Hits';
        else if (catName === 'Feel good') query = 'Feel Good Happy Songs';
        else if (catName === 'Romance') query = 'Romantic Love Songs';
        else if (catName === 'Workout') query = 'Gym Workout Motivation Music';
        else if (catName === 'Sleep') query = 'Sleeping Calming Relaxation Music';
        else if (catName === 'Sad') query = 'Sad Melancholic Songs';
        else if (catName === 'Happy') query = 'Upbeat Happy Songs';
        else if (catName === 'Nostalgia') query = '2000s Hits Nostalgia Songs';

        try {
            var r = await fetch(API.search + '?query=' + encodeURIComponent(query) + '&type=all');
            var d = await r.json();
            if (d.status) {
                S.hc = d.result.songs ? d.result.songs.map(function(s) {
                    return {
                        id: s.videoId,
                        videoId: s.videoId,
                        title: cn(s.title),
                        artist: cn(s.artist),
                        artistId: s.artistId || '',
                        cover: toHDCover(s.thumbnail, s.videoId),
                        ytUrl: s.url
                    };
                }) : [];
                S.hcp = [].concat(d.result.playlists || []).concat(d.result.albums || []);
                S.hca = d.result.artists || [];
            }
        } catch(e) { S.hc = []; S.hcp = []; S.hca = []; }

        Home.displayCategoryView();
    },

    displayCategoryView() {
        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'none';
        if (catView) catView.style.display = 'block';
        if (!catView) return;

        var catName = Home.activeCategory || 'Kategori';

        var songsHtml = '';
        if (S.hc && S.hc.length > 0) {
            songsHtml = S.hc.map(function(t, i) {
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto  shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
                } else {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
                }

                return '<div onclick="PK(\'homecat\','+i+')" class="home-cat-card group '+ (isPlay ? 'bg-[#343a4e] border border-white/40 shadow-xl' : (isCur ? 'bg-[#2e3344] border border-white/30' : 'bg-[#20222c] border border-white/10 hover:bg-[#282b38]')) +' rounded-2xl flex items-center gap-3 p-2.5 cursor-pointer active:scale-95 transition-all animate-card-up shadow-lg shadow-black/20" style="animation-delay:'+Math.min(i*30, 450)+'ms">'+
                    '<img src="'+t.cover+'" class="w-12 h-12 rounded-xl object-cover shadow-md shrink-0 border border-white/10" onerror="this.src=\''+FI+'\'" />'+
                    '<div class="truncate flex-1 min-w-0"><h3 class="font-semibold text-sm truncate '+(isCur?'text-white font-black':'text-white/90')+'">'+es(t.title)+'</h3><p class="text-white/60 text-xs truncate mt-0.5">'+es(t.artist)+'</p></div>'+
                    '<div class="home-cat-icon ml-auto">'+playIconHtml+'</div>'+
                '</div>';
            }).join('');
        } else {
            songsHtml = '<p class="text-center text-white/70 text-sm py-8 col-span-2">Tidak ada lagu ditemukan untuk kategori ini</p>';
        }

        var plistHtml = '';
        if (S.hcp && S.hcp.length > 0) {
            plistHtml = S.hcp.slice(0, 10).map(function(p, i) {
                return '<div onclick="Album.open(\''+p.id+'\', \''+(p.cover||FI)+'\')" class="flex-shrink-0 w-36 cursor-pointer active:scale-95 group p-2.5 rounded-2xl bg-[#20222c] border border-white/10 shadow-xl hover:bg-[#282b38] transition-all flex flex-col animate-card-left" style="animation-delay:'+Math.min(i*40, 400)+'ms"><div class="w-full aspect-square mb-2 relative rounded-xl overflow-hidden shadow-md"><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-xs truncate text-white px-0.5">'+es(p.title)+'</h3><p class="text-white/60 text-[10px] truncate mt-0.5 px-0.5">'+es(p.artist)+'</p></div>';
            }).join('');
        }

        var artistsHtml = '';
        if (S.hca && S.hca.length > 0) {
            artistsHtml = S.hca.slice(0, 8).map(function(p, i) {
                return '<div onclick="Artist.open(\''+p.id+'\', \''+esJs(p.name||p.title)+'\')" class="flex-shrink-0 w-32 cursor-pointer active:scale-95 group p-2.5 rounded-2xl bg-[#20222c] border border-white/10 shadow-xl hover:bg-[#282b38] transition-all flex flex-col items-center animate-card-left" style="animation-delay:'+Math.min(i*40, 400)+'ms"><div class="w-24 h-24 mb-2 relative rounded-full overflow-hidden shadow-md border-2 border-white/10 group-hover:scale-105 transition-transform duration-300"><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-center text-xs truncate text-white w-full px-0.5">'+es(p.name||p.title)+'</h3><p class="text-white/60 text-[10px] uppercase tracking-wider font-semibold mt-0.5">Artist</p></div>';
            }).join('');
        }

        catView.innerHTML = `
        <div class="space-y-6 pb-6 animate-card-up">
            <div class="flex justify-between items-center bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-[#a0a5b0]">Kategori:</span>
                    <span class="font-bold text-sm text-white bg-white/10 px-3 py-1 rounded-full border border-white/20">${es(catName)}</span>
                </div>
                <button onclick="Home.selectCategory('Semua')" class="text-xs px-3.5 py-1.5 rounded-full btn-chrome text-white hover:text-white transition-all flex items-center gap-1 active:scale-95">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i> Reset / Semua
                </button>
            </div>

            <div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2 text-white">
                    <i data-lucide="music" class="w-4 h-4 text-emerald-400"></i>
                    <span>Lagu Populer - ${es(catName)}</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${songsHtml}</div>
            </div>

            ${plistHtml ? `<div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2 text-white">
                    <i data-lucide="disc" class="w-4 h-4 text-purple-400"></i>
                    <span>Playlist & Album ${es(catName)}</span>
                </h2>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-3">${plistHtml}</div>
            </div>` : ''}

            ${artistsHtml ? `<div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2 text-white">
                    <i data-lucide="users" class="w-4 h-4 text-rose-400"></i>
                    <span>Artis Related</span>
                </h2>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-3">${artistsHtml}</div>
            </div>` : ''}
        </div>`;

        lucide.createIcons();
        Home.renderActive();
    },

    showSkeleton() {
        var g = gid('home-grid'), s = gid('home-scroll'), a = gid('home-artists');
        if (g) {
            g.innerHTML = Array(6).fill(0).map(function() {
                return '<div class="glass rounded-xl flex items-center gap-3 p-2 animate-pulse"><div class="w-14 h-14 rounded-lg bg-white/5"></div><div class="flex-grow space-y-2"><div class="h-3.5 bg-white/10 rounded w-3/4"></div><div class="h-2.5 bg-white/5 rounded w-1/2"></div></div></div>';
            }).join('');
        }
        if (s) {
            s.innerHTML = Array(4).fill(0).map(function() {
                return '<div class="flex-shrink-0 w-40 animate-pulse"><div class="w-40 h-40 mb-2 rounded-xl bg-white/5"></div><div class="h-3.5 bg-white/10 rounded w-3/4 mb-1"></div><div class="h-2.5 bg-white/5 rounded w-1/2"></div></div>';
            }).join('');
        }
        if (a) {
            a.innerHTML = Array(4).fill(0).map(function() {
                return '<div class="flex-shrink-0 w-32 animate-pulse"><div class="w-32 h-32 mb-2 rounded-full bg-white/5"></div><div class="h-3.5 bg-white/10 rounded w-3/4 mx-auto mb-1"></div></div>';
            }).join('');
        }
    },

    async fetch() {
        Home.showSkeleton();
        if (!navigator.onLine) {
            var offlineSongs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
            S.ht = offlineSongs;
            S.ha = [];
            S.hp = [];
            Home.show();
            return;
        }
        try {
            var q = 'Trend Indonesia';
            var r = await fetch(API.search + '?query=' + encodeURIComponent(q) + '&type=songs');
            var d = await r.json();
            if (d.status) {
                if (d.result.songs && d.result.songs.length > 0) {
                    S.ht = d.result.songs.map(function(s) {
                        return {
                            id: s.videoId,
                            videoId: s.videoId,
                            title: cn(s.title),
                            artist: cn(s.artist),
                            artistId: s.artistId || '',
                            cover: toHDCover(s.thumbnail, s.videoId),
                            ytUrl: s.url
                        };
                    });
                }
                var plist = [].concat(d.result.playlists || []).concat(d.result.albums || []);
                if (plist.length < 4) {
                    var playlistQueries = ['Lagu Indonesia Populer', 'Top Hits Indonesia', 'Playlist Terbaik', 'Hits Viral Indonesia'];
                    var q2 = playlistQueries[Math.floor(Math.random() * playlistQueries.length)];
                    if (q2 !== q) {
                        try {
                            var r2 = await fetch(API.search + '?query=' + encodeURIComponent(q2) + '&type=playlists');
                            var d2 = await r2.json();
                            if (d2.status) {
                                plist = plist.concat(d2.result.playlists || []).concat(d2.result.albums || []);
                            }
                        } catch(e){}
                    }
                }
                if (plist.length > 0) {
                    S.hp = plist.sort(function() { return 0.5 - Math.random(); });
                }
            }
        } catch(e){}

        var topArtistsList = [
            { name: 'XXXTENTACION', id: 'UCnAcxgRZ065f_eXK1o85c1w', cover: 'https://yt3.googleusercontent.com/No3I8pA9ows2dy6NElEr9mCXLzYxgjVvsQr7h69C03palsH1u8Q8iw-sAAUxav599Wmi64up8lbDGbI=w800-h800-l90-rj' },
            { name: 'Lil Peep', id: 'UCxcyWcW0kZFGRyetDHr3UuA', cover: 'https://yt3.googleusercontent.com/TbvXoTXJz8a2xfkJxZsI0riSyrUSibnVHBFxhHTeJefWY-2-60x0VhUPkO89uF3CGOPLalsTTM-OlEeI=w800-h800-l90-rj' },
            { name: 'Juice WRLD', id: 'UCbn0GRdgsQtl9hlV-IqxFGg', cover: 'https://lh3.googleusercontent.com/6YKQ7fDb3ISfzNUjpJnXX1FLw9EQ8eK5qHa07VANJtkaGagUtqtHiAOKz2AJ1AoASNacrCeg8pd35ao=w800-h800-l90-rj' },
            { name: 'Lil Loaded', id: 'UCzM0GZjC6wQnvpljr3SbKRw', cover: 'https://lh3.googleusercontent.com/jectExZmYnwQhQWHO_gqTHDhDlOpz6HMwR5kd8f6a2fQ7-KVeSGoR_IHuZPIk_PHQEt-0jzQiCCU-io=w800-h800-l90-rj' },
            { name: 'Hindia', id: 'UCzhVLh7xVyH3MpqO_KY6SYg', cover: 'https://yt3.googleusercontent.com/8ImMAMQSD4FA6-gdqCZWSFaB-drHvkdfiFcFAk7Mcyy56ctfWD-Xxno-CHfGC4L6Ql8aR61XT0vX0F4b=w800-h800-l90-rj' }
        ];
        S.ha = topArtistsList;

        try {
            var ra = await fetch(API.search + '?query=' + encodeURIComponent('XXXTENTACION Lil Peep Juice WRLD Lil Loaded Hindia') + '&type=artists');
            var da = await ra.json();
            if (da.status && da.result && da.result.artists && da.result.artists.length > 0) {
                da.result.artists.forEach(function(art) {
                    var artName = (art.title || art.name || '').toLowerCase();
                    var matched = S.ha.find(function(a) { return a.name.toLowerCase() === artName || artName.includes(a.name.toLowerCase()); });
                    if (matched) {
                        if (art.cover) matched.cover = art.cover;
                        if (art.id) matched.id = art.id;
                    }
                });
            }
        } catch(e) {}

        Home.show();
    },

    show() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.displayCategoryView();
            return;
        }

        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'block';
        if (catView) catView.style.display = 'none';

        var g = gid('home-grid'), s = gid('home-scroll'); if (!g || !s) return;
        if ((!S.ht || S.ht.length === 0) && !navigator.onLine) {
            g.innerHTML = '<div class="col-span-2 md:col-span-4 bg-[#20222c] border border-white/10 rounded-2xl p-5 text-center space-y-2 shadow-xl">'+
                '<div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30"><i data-lucide="wifi-off" class="w-5 h-5"></i></div>'+
                '<p class="text-white font-bold text-sm">Mode Offline (Tidak Ada Internet)</p>'+
                '<p class="text-white/60 text-xs">Putar lagu yang tersimpan sebelumnya di tab Offline PWA.</p>'+
                '<button onclick="App.switch(\'offline\')" class="mt-2 btn-chrome px-4 py-2 text-xs font-bold rounded-xl active:scale-95 transition inline-flex items-center gap-1.5"><i data-lucide="disc" class="w-4 h-4"></i> Buka Lagu Offline</button>'+
            '</div>';
        } else {
            g.innerHTML = (S.ht || []).slice(0, 6).map(function(t, i) {
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto  shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
                }

                var cardBg = isPlay ? 'bg-[#343a4e] border border-white/40 shadow-xl' : (isCur ? 'bg-[#2e3344] border border-white/30' : 'bg-[#20222c] border border-white/10 hover:bg-[#282b38]');
                var textStyle = isCur ? 'text-white font-bold' : '';

                return '<div onclick="PK(\'home1\','+i+')" class="home-grid-card '+cardBg+' rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all duration-300 group shadow-lg shadow-black/25">'+
                    '<img src="'+t.cover+'" class="w-14 h-14 rounded-xl object-cover shrink-0 shadow-md border border-white/10" onerror="this.src=\''+FI+'\'" />'+
                    '<div class="min-w-0 flex-1">'+
                        '<h3 class="home-grid-title font-semibold text-sm text-white truncate '+textStyle+'">'+es(t.title)+'</h3>'+
                        '<p class="text-xs text-white/60 truncate mt-0.5">'+es(t.artist)+'</p>'+
                    '</div>'+
                    '<div class="home-grid-icon shrink-0">'+playIconHtml+'</div>'+
                '</div>';
            }).join('');
        }

        var pls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
        var plHtml = '';

        plHtml += '<div onclick="if(typeof Library !== \'undefined\') Library.createNew()" class="flex-shrink-0 w-36 md:w-44 cursor-pointer active:scale-95 transition-all group"><div class="p-2.5 rounded-2xl bg-[#20222c]/50 border border-dashed border-white/20 shadow-xl group-hover:border-white/40 group-hover:bg-[#20222c] transition-all flex flex-col items-center justify-center aspect-square mb-2"><i data-lucide="plus" class="w-8 h-8 text-white/70"></i><span class="text-xs text-white/70 mt-2 font-medium">Buat Playlist</span></div><h3 class="font-semibold text-sm text-white/70 truncate px-0.5">Buat Baru</h3></div>';

        pls.forEach(function(p, i) {
            plHtml += '<div onclick="Library.open(\''+p.id+'\')" class="flex-shrink-0 w-36 md:w-44 cursor-pointer active:scale-95 transition-all group"><div class="p-2.5 rounded-2xl bg-[#20222c] border border-white/10 shadow-xl group-hover:bg-[#282b38] transition-all flex flex-col"><div class="w-full aspect-square rounded-xl overflow-hidden relative shadow-md mb-2"><img src="'+(p.image||(p.songs.length>0?p.songs[0].cover:FI))+'" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src=\''+FI+'\'" /><div class="absolute bottom-2 right-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all shadow-black/40"><i data-lucide="play" class="w-4 h-4 text-white fill-current ml-0.5"></i></div></div><h3 class="font-semibold text-sm text-white truncate px-0.5">'+es(p.name)+'</h3><p class="text-xs text-white/60 truncate mt-0.5 px-0.5">'+p.songs.length+' lagu</p></div></div>';
        });

        s.innerHTML = plHtml;

        var a = gid('home-artists');
        if (a) {
            if (S.ha && S.ha.length > 0) {
                var artHtml = S.ha.slice(0, 10).map(function(p, i) {
                    var imgUrl = toWebp(p.cover) || FI;
                    return '<div onclick="Artist.open(\''+p.id+'\', \''+esJs(p.name||p.title)+'\', \''+(p.cover||'')+'\')" class="flex-shrink-0 w-32 cursor-pointer active:scale-95 transition-all group"><div class="p-2.5 rounded-2xl bg-[#20222c] border border-white/10 shadow-xl group-hover:bg-[#282b38] transition-all flex flex-col items-center"><div class="w-24 h-24 rounded-full overflow-hidden relative shadow-md mb-2 border-2 border-white/10 group-hover:scale-105 transition-transform duration-300"><img src="'+imgUrl+'" class="w-full h-full object-cover" onerror="handleImgError(this)" /></div><h3 class="font-semibold text-center text-xs text-white truncate w-full px-0.5">'+es(p.name||p.title)+'</h3><p class="text-white/60 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">Artist</p></div></div>';
                }).join('');
                a.innerHTML = artHtml;
                a.parentElement.style.display = 'block';
            } else {
                a.parentElement.style.display = 'none';
            }
        }
        lucide.createIcons();
        Home.renderActive();
                                                             
        Home.loadAllCategories();
    },

    renderActive() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.renderActiveCategory();
            return;
        }

        var g = gid('home-grid');
        if (g && g.children && S.ht) {
            var items = S.ht.slice(0, 6);
            var cards = g.querySelectorAll('.home-grid-card');
            cards.forEach(function(el, i) {
                var t = items[i];
                if (!t) return;
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></div>';
                }

                var cardBg = isPlay ? 'bg-[#343a4e] border border-white/40 shadow-xl' : (isCur ? 'bg-[#2e3344] border border-white/30' : 'bg-[#20222c] border border-white/10 hover:bg-[#282b38]');
                el.className = 'home-grid-card ' + cardBg + ' rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all duration-300 group shadow-lg shadow-black/25';

                var titleEl = el.querySelector('.home-grid-title');
                if (titleEl) {
                    titleEl.className = 'home-grid-title font-semibold text-sm text-white truncate ' + (isCur ? 'font-black' : '');
                }
                var iconWrap = el.querySelector('.home-grid-icon');
                if (iconWrap) {
                    iconWrap.innerHTML = playIconHtml;
                }
            });
        }
    },

    renderActiveCategory() {
        var catView = gid('home-category-view');
        if (!catView || !S.hc) return;

        var cards = catView.querySelectorAll('.home-cat-card');
        cards.forEach(function(el, i) {
            var t = S.hc[i];
            if (!t) return;

            var isCur = S.ct && (
                S.ct.id === t.id ||
                S.ct.videoId === t.id ||
                (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                (S.ct.title === t.title && S.ct.artist === t.artist)
            );
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            var playIconHtml = '';
            if (isLoad) {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
            } else if (isPlay) {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-1 sm:ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3 sm:w-3.5 h-3 sm:h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
            } else if (isCur) {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><svg class="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></div>';
            } else {
                playIconHtml = '<div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><svg class="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></div>';
            }

            var cardBg = isPlay ? 'bg-[#343a4e] border border-white/40 shadow-xl' : (isCur ? 'bg-[#2e3344] border border-white/30' : 'bg-[#20222c] border border-white/10 hover:bg-[#282b38]');
            var isSnap = el.classList.contains('snap-start');
            el.className = (isSnap ? 'snap-start ' : '') + 'home-cat-card group ' + cardBg + ' rounded-2xl flex items-center gap-3 p-2.5 cursor-pointer active:scale-95 transition-all shadow-lg shadow-black/20' + (isSnap ? ' w-full' : '');

            var titleEl = el.querySelector('h3');
            if (titleEl) {
                titleEl.className = 'font-semibold text-xs sm:text-sm truncate ' + (isCur ? 'text-white font-black' : 'text-white/90');
            }
            var iconWrap = el.querySelector('.home-cat-icon') || el.children[el.children.length - 1];
            if (iconWrap) {
                iconWrap.innerHTML = playIconHtml;
            }
        });
    },

    refresh() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.fetchCategoryData(Home.activeCategory);
        } else {
            Home.fetch();
        }
        var m = gid('main-area');
        if (m) m.scrollTop = 0;
    }
};

window.addEventListener('zmusic:playlists-changed', function(){
    if (typeof S !== 'undefined' && S.at === 'home' && typeof Home !== 'undefined' && typeof Home.render === 'function') {
        Home.render();
    }
});
window.addEventListener('storage', function(e){
    if (e.key === 'nanzz_playlists' && typeof S !== 'undefined' && S.at === 'home' && typeof Home !== 'undefined' && typeof Home.render === 'function') {
        Home.render();
    }
});
