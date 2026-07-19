// Service Worker for DataGuy Web Push Notifications

self.addEventListener("push", (event) => {
  let data = {
    title: "DataGuy Update",
    body: "You have a new notification",
    url: "/dashboard",
    icon: "/logo192.png"
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/logo192.png",
    badge: "/badge.png", // optional small icon for android status bar
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickActionPromise = clients.matchAll({
    type: "window",
    includeUncontrolled: true
  }).then((windowClients) => {
    // If a window is already open, navigate it to the link, or open a new window
    const targetUrl = event.notification.data.url;
    
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(self.location.origin) && "focus" in client) {
        return client.navigate(targetUrl).then(c => c.focus());
      }
    }
    
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  });

  event.waitUntil(clickActionPromise);
});
