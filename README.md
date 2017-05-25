**Hybrid SDK**

The SDK provides a secure way to call code running on your local machine inside a chatbot. Your code can be connecting to your Enterprise Information Systems to process a businss function.

Key Advantages
1. The hybrid SDK does not require you to develop any SOAP/REST services.
2. Use any of your libraries and run the business logic in any container and machine of your choice.


The core idea is to implement services and register them when the ```Avaamo``` constructor is instantiated.

Get Started

1. clone this repository and ```npm install``` the dependencies.
2. Initialize the Avaamo library.
3. Add callable functions

The following sample code shows the code.

```
const Avaamo = require("./index");
const bot_uuid = "<YOUR_BOT_UUID>";
const access_token = "<YOUR_BOT_ACCESS_TOKEN>";

new Avaamo(bot_uuid, access_token, {
    
    /** Service Name: create_ticket **/

    create_ticket: (response) => {
        console.log("Request from bot engine", JSON.stringify(response));
        return {
            ticket_id: "My Ticket ID"
        };
    },
    
    /** Service Name: edit_ticket **/

    edit_ticket: (response) => {
        return response;
    }
});
```

In line #25, the 3rd argument to the instantiation method is the collection of services. 
Each service is a method which should return a value.

The service method will be called whenever the SDK receives a service call from the Bot Designer.

In the designer, the following piece of code will call the ```create_ticket``` service and get the response.

```
return HybridSDK.call(
  "create_ticket",
  {
    title: "Desktop blacked out",
    description: "Desktop not showing anything after booting",
    user_name: context.user.first_name,
  }
).then(function(response) {
  if(response.error) {
    return response.message;
  }
  return "Here is the ticket ID: "+response.ticket_id;
}).catch(e => e);
```

This piece of code in the designer will receive the response of the services from the SDK. 

The ```HybridSDK.call``` method is available only in output nodes of the conversation flow and it takes 2 arguments - a service name and payload. This payload will be available as argument in the corresponding service.

If a service is not found or a service is not a method, the code in the designer will receive the following responses respectively:

```
{
    error: 404,
    message: `Service "service_name" not found`
}
```

```
{
    error: 403,
    message: `Service "service_name" is not a method`
}
```

If in case the ```HybridSDK.call``` doesn't receive response for a service call in 25 seconds, a "SERVICE TIME-OUT" exception will be thrown.
