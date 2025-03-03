$(document).ready(function () {
    // Toggle chevron icon when a card header is clicked.
    $('.card-header').off('click').on('click', function () {
        $(this).find('i').toggleClass('fa-chevron-down fa-chevron-up');
    });

    // --- Common sliding window function for pagination ---
    function updateSlidingWindow($nav, windowSize) {
        var totalPages = parseInt($nav.attr('data-total-pages'));
        var startPage = parseInt($nav.attr('data-start-page'));
        var activePage = parseInt($nav.attr('data-active-page'));
        var endPage = Math.min(startPage + windowSize - 1, totalPages);

        // First ensure all pages are hidden
        $nav.find('li.page-number').hide();

        // Then show only the ones in our window
        for (var i = startPage; i <= endPage; i++) {
            $nav.find('li.page-number[data-page="' + i + '"]').show();
        }

        // Highlight active page
        $nav.find('li.page-number').removeClass('active');
        $nav.find('li.page-number[data-page="' + activePage + '"]').addClass('active');
    }

    // --------------------------
    // Inner (Child) Pagination
    // --------------------------
    $('.child-pagination').each(function () {
        var $nav = $(this);
        if (!$nav.attr('data-start-page')) $nav.attr('data-start-page', '1');
        if (!$nav.attr('data-active-page')) $nav.attr('data-active-page', '1');
        updateSlidingWindow($nav, 5);
    });

    function updateChildTable(targetSelector, activePage) {
        var $rows = $(targetSelector).find('.child-table tbody tr');
        $rows.stop(true, true);
        $rows.filter(':visible').fadeOut(200, function () {
            $rows.each(function () {
                var rowPage = parseInt($(this).attr('data-child-page'));
                if (rowPage === activePage) {
                    $(this).fadeIn(200);
                } else {
                    $(this).hide();
                }
            });
        });
    }

    $('.child-pagination').off('click', '.child-page-link').on('click', '.child-page-link', function () {
        var $nav = $(this).closest('.child-pagination');
        var targetSelector = $(this).data('target');
        var page = parseInt($(this).data('page'));
        $nav.attr('data-active-page', page);
        updateSlidingWindow($nav, 5);
        updateChildTable(targetSelector, page);
    });

    $('.child-pagination').off('click', 'li.next-set').on('click', 'li.next-set', function () {
        var $nav = $(this).closest('.child-pagination');
        var totalPages = parseInt($nav.attr('data-total-pages'));
        var activePage = parseInt($nav.attr('data-active-page'));
        if (activePage < totalPages) {
            activePage++;
            $nav.attr('data-active-page', activePage);
            var startPage = parseInt($nav.attr('data-start-page'));
            if (activePage > startPage + 5 - 1) {
                $nav.attr('data-start-page', startPage + 1);
            }
            updateSlidingWindow($nav, 5);
            var targetSelector = $nav.data('target');
            updateChildTable(targetSelector, activePage);
        }
    });

    $('.child-pagination').off('click', 'li.prev-set').on('click', 'li.prev-set', function () {
        var $nav = $(this).closest('.child-pagination');
        var activePage = parseInt($nav.attr('data-active-page'));
        if (activePage > 1) {
            activePage--;
            $nav.attr('data-active-page', activePage);
            var startPage = parseInt($nav.attr('data-start-page'));
            if (activePage < startPage) {
                $nav.attr('data-start-page', startPage - 1);
            }
            updateSlidingWindow($nav, 5);
            var targetSelector = $nav.data('target');
            updateChildTable(targetSelector, activePage);
        }
    });

    $('.child-pagination').off('click', 'li.first a').on('click', 'li.first a', function () {
        var $nav = $(this).closest('.child-pagination');
        $nav.attr('data-active-page', 1);
        $nav.attr('data-start-page', 1);
        updateSlidingWindow($nav, 5);
        var targetSelector = $nav.data('target');
        updateChildTable(targetSelector, 1);
    });

    $('.child-pagination').off('click', 'li.last a').on('click', 'li.last a', function () {
        var $nav = $(this).closest('.child-pagination');
        var totalPages = parseInt($nav.attr('data-total-pages'));
        $nav.attr('data-active-page', totalPages);
        var newStart = Math.max(totalPages - 5 + 1, 1);
        $nav.attr('data-start-page', newStart);
        updateSlidingWindow($nav, 5);
        var targetSelector = $nav.data('target');
        updateChildTable(targetSelector, totalPages);
    });

    // --------------------------
    // Outer (Website) Pagination
    // --------------------------

    // Get URL parameter value
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Initialize pagination with correct state based on URL
    var currentPage = parseInt(getUrlParameter('page')) || 1;
    var totalPages = parseInt($('.outer-pagination').attr('data-total-pages')) || 1;

    // Calculate correct start page based on current page
    function calculateStartPage(page, windowSize, totalPages) {
        // For "Last" button (page is at the end)
        if (page === totalPages) {
            return Math.max(totalPages - windowSize + 1, 1);
        }
        // For pages that would be in the middle or beginning of a window
        else if (page <= windowSize) {
            return 1;
        }
        // For pages beyond the first window
        else {
            // Center the active page in the window when possible
            var halfWindow = Math.floor(windowSize / 2);
            if (page + halfWindow <= totalPages) {
                return Math.max(page - halfWindow, 1);
            } else {
                return Math.max(totalPages - windowSize + 1, 1);
            }
        }
    }

    // Set correct initial state
    $('.outer-pagination').each(function () {
        var $nav = $(this);
        var windowSize = 5;
        var startPage = calculateStartPage(currentPage, windowSize, totalPages);

        $nav.attr('data-active-page', currentPage);
        $nav.attr('data-start-page', startPage);

        // Apply immediately without animation
        updateSlidingWindow($nav, windowSize);
    });

    // Store pagination data in the URL directly - no need for sessionStorage
    function createPaginationUrl(baseUrl, page) {
        var url = new URL(baseUrl, window.location.origin);
        url.searchParams.set('page', page);
        return url.toString();
    }

    // Outer page number click
    $('.outer-pagination').off('click', '.outer-page-link').on('click', '.outer-page-link', function (e) {
        e.preventDefault();
        var $nav = $(this).closest('.outer-pagination');
        var page = parseInt($(this).data('page'));
        var url = $(this).data('url');

        window.location.href = url;
    });

    // Outer forward arrow
    $('.outer-pagination').off('click', 'li.next-set').on('click', 'li.next-set', function (e) {
        e.preventDefault();
        var $nav = $(this).closest('.outer-pagination');
        var totalPages = parseInt($nav.attr('data-total-pages'));
        var activePage = parseInt($nav.attr('data-active-page'));

        if (activePage < totalPages) {
            activePage++;
            var url = $nav.find('li.page-number[data-page="' + activePage + '"] a').data('url');
            window.location.href = url;
        }
    });

    // Outer backward arrow
    $('.outer-pagination').off('click', 'li.prev-set').on('click', 'li.prev-set', function (e) {
        e.preventDefault();
        var $nav = $(this).closest('.outer-pagination');
        var activePage = parseInt($nav.attr('data-active-page'));

        if (activePage > 1) {
            activePage--;
            var url = $nav.find('li.page-number[data-page="' + activePage + '"] a').data('url');
            window.location.href = url;
        }
    });

    // Outer "First" link
    $('.outer-pagination').off('click', 'li.first a').on('click', 'li.first a', function (e) {
        e.preventDefault();
        var url = $(this).data('url');
        window.location.href = url;
    });

    // Outer "Last" link
    $('.outer-pagination').off('click', 'li.last a').on('click', 'li.last a', function (e) {
        e.preventDefault();
        var url = $(this).data('url');
        window.location.href = url;
    });
});
