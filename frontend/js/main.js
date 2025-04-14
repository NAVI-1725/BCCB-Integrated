$(document).ready(function () {
    // Spinner
    setTimeout(function () {
        $('#spinner').fadeOut('slow');
    }, 1000);

    // WOW.js for animation
    new WOW().init();

    // Confetti on event (Example)
    if (window.location.search.includes('registered')) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    // Message box trigger
    $('.message').addClass('show');

    // Sidebar toggle functionality
    $('#toggleSidebar').on('click', function () {
        $('#sidebar').toggleClass('open');
        $('.main-content').toggleClass('sidebar-open');
    });

    // Theme toggle
    $('#changeTheme').on('click', function () {
        $('body').toggleClass('dark-mode');
    });

    // Smooth scroll
    $('.header-nav-item').on('click', function (e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top
        }, 500);
    });

    // Handle stat items interaction (example)
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('click', () => {
            alert('You clicked on a stat item!');
        });
    });

    // Edit Account Details
    $('#editDetails').on('click', function () {
        window.location.href = '/user/account/update';  // Navigate to account update page
    });

    // Handle form submission for saving changes (password update)
    $('#saveChanges').on('click', function () {
        const formData = {
            name: $('#name').val(),
            email: $('#email').val(),
            mobile: $('#mobile').val(),
            password: $('#password').val()
        };

        $.ajax({
            url: '/user/account/update',
            method: 'POST',
            data: formData,
            success: function (response) {
                if (response.success) {
                    alert('Account details updated successfully!');
                } else {
                    alert('Error updating account details.');
                }
            }
        });
    });

    // Stay on the same page after account update
    if (window.location.search.includes('updated')) {
        alert('Your account has been updated successfully!');
    }

    // Logout Logic
    let clickCount = 0; // Track the number of clicks

    // Function to show the message
    const showMessage = () => {
        const message = $('<div>', {
            class: 'alert alert-info fixed-bottom mb-4 ml-auto mr-auto w-50 text-center',
            text: 'Click again on the icon to logout'
        }).appendTo('body');

        // Remove the message after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
    };

    // Handle profile icon click
    $('#profilePic').on('click', function () {
        clickCount++; // Increment the click count

        // First click shows the message, second click logs out
        if (clickCount === 1) {
            showMessage();
        } else if (clickCount === 2) {
            // Logout
            fetch('/logout', { method: 'POST' })
                .then((response) => {
                    if (response.ok) {
                        window.location.href = '/login';  // Redirect to login page after successful logout
                    } else {
                        console.error('Logout failed.');
                    }
                })
                .catch((error) => console.error('Error:', error));
        }
    });

    // Toggle profile dropdown
    $('#profilePic').on('click', function () {
        const profileDropdown = $('#profileDropdown');
        const isVisible = profileDropdown.hasClass('show');
        profileDropdown.toggleClass('show', !isVisible);
        profileDropdown.attr('aria-hidden', isVisible);
    });

    // Close profile dropdown if clicked outside
    $(document).on('click', function (event) {
        if (!$('#profileDropdownContainer').has(event.target).length) {
            $('#profileDropdown').removeClass('show').attr('aria-hidden', 'true');
        }
    });
});
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent the default form submission

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Send POST request to the server
            const response = await fetch('/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                // Display error message and trigger vibration
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = data.error || 'Invalid credentials';
                errorMessage.style.display = 'block';

                // Add shake animation
                const form = document.getElementById('login-form');
                form.classList.add('shake');
                setTimeout(() => form.classList.remove('shake'), 500);
            } else {
                // Redirect to the dashboard or desired page on success
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    });

