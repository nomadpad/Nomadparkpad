/* =========================================================

   NOMAD PARK PAD SERVICE WORKER

   Background Push Notifications

========================================================= */

self.addEventListener("push", (event) => {

  let data = {

    title: "Nomad Park Pad",

    body: "You have a new notification.",

    url: "/traveller-dashboard.html"

  };

  if (event.data) {

    try {

      const incoming = event.data.json();

      data = {

        ...data,

        ...incoming

      };

    } catch {

      data.body = event.data.text();

    }

  }

  const options = {

    body: data.body,

    icon: "/logo.png",

    badge: "/logo.png",

    data: {

      url: data.url

    }

  };

  event.waitUntil(

    self.registration.showNotification(

      data.title,

      options

    )

  );

});

/* =========================================================

   OPEN NOMAD WHEN NOTIFICATION IS TAPPED

========================================================= */

self.addEventListener(

  "notificationclick",

  (event) => {

    event.notification.close();

    const targetUrl =

      event.notification.data?.url ||

      "/traveller-dashboard.html";

    event.waitUntil(

      clients.matchAll({

        type: "window",

        includeUncontrolled: true

      }).then((clientList) => {

        for (const client of clientList) {

          if ("focus" in client) {

            client.navigate(targetUrl);

            return client.focus();

          }

        }

        if (clients.openWindow) {

          return clients.openWindow(targetUrl);

        }

      })

    );

  }

);