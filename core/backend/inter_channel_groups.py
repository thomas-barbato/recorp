from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_message_to_group(group_name, message, type):
    channel_layer = get_channel_layer()
    
    # If calling from a synchronous context (like a Django view)
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': type,  # This should match a method name in your consumer
            'message': message
            # Add any other data you want to send
        }
    )

# If calling from an asynchronous context (like inside a consumer)
async def send_message_to_group_async(group_name, message):
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        group_name,
        {
            'type': 'chat.message',  # This should match a method name in your consumer
            'message': message
            # Add any other data you want to send
        }
    )