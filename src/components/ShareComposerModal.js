import Ionicons from "@react-native-vector-icons/ionicons";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { radius, theme } from "../theme/theme";
import ConfirmModal from "./ConfirmModal";
import { useState } from "react";
import { MESSAGE_STYLES } from "../constants/constant";

export function ShareComposerModal({
    visible,
    event,
    defaultMessage,
    selectedTemplate,
    setSelectedTemplate,
    selectedMessageStyle,
    selectMessageStyle,
    shareMessage,
    setShareMessage,
    customImage,
    pickCustomImage,
    sharing,
    setSharing,
    onClose,
}) {
    const message = shareMessage.trim() || defaultMessage;
    const [modalDetails, setModalDetails] = useState({ visible: false, title: "", message: "" })
    if (!event) return null;

    const previewImage = customImage ? { uri: customImage } : selectedTemplate.image;

    const doShare = async () => {
        if (!shareMessage.trim()) {
            setModalDetails({ visible: true, title: "Message required", message: 'Please enter a message to share.' })
            return;
        }

        const message = shareMessage.trim() || getDefaultShareMessage(event);

        try {
            setSharing(true);

            // await RNShare.open({
            //     title: event.title,
            //     message: shareMessage,
            //     url: customImage || undefined,
            //     type: customImage ? 'image/*' : undefined,
            //     failOnCancel: false,
            // });
            await Share.share({
                title: event.title,
                message,
            });


            onClose();
        } catch (e) {
            if (e?.message !== 'User did not share') {
                Alert.alert('Could not share', e.message);
            }
        } finally {
            setSharing(false);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={onClose}
            >
                <View style={styles.shareModalOverlay}>
                    <View style={styles.shareModalSheet}>

                        {/* Header */}
                        <View style={styles.shareModalHeader}>
                            <Text style={styles.shareModalTitle}>
                                Share Invitation
                            </Text>

                            <Pressable onPress={onClose} hitSlop={10}>
                                <Ionicons
                                    name="close"
                                    size={22}
                                    color={theme.textMuted}
                                />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >

                            {/* Preview */}
                            {/* <Text style={styles.shareSectionTitle}>
                                Preview
                            </Text>

                            <View style={styles.sharePreview}>
                                <Image
                                    source={previewImage}
                                    style={styles.sharePreviewImage}
                                />

                                <View style={styles.sharePreviewOverlay}>
                                    <Text style={styles.sharePreviewTitle}>
                                        {event.title}
                                    </Text>

                                    <Text style={styles.sharePreviewDate}>
                                        {dayjs(event.event_date).format('dddd, D MMMM YYYY')}
                                    </Text>

                                    {!!event.start_time && (
                                        <Text style={styles.sharePreviewDate}>
                                            {dayjs(
                                                `2000-01-01 ${event.start_time}`
                                            ).format('h:mm a')}
                                        </Text>
                                    )}
                                </View>
                            </View> */}

                            {/* Image templates */}
                            {/* <Text style={styles.shareSectionTitle}>
                                Choose image
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.templateList}
                            >
                                {SHARE_TEMPLATES.map((template) => {
                                    const selected =
                                        !customImage &&
                                        selectedMessageStyle?.id === template.id;

                                    return (
                                        <Pressable
                                            key={template.id}
                                            onPress={() => setSelectedTemplate(template)}
                                            style={[
                                                styles.templateItem,
                                                selected && styles.templateItemSelected,
                                            ]}
                                        >
                                            <Image
                                                source={template.image}
                                                style={styles.templateImage}
                                            />

                                            <Text style={styles.templateName}>
                                                {template.name}
                                            </Text>

                                            {selected && (
                                                <View style={styles.templateCheck}>
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={13}
                                                        color="#fff"
                                                    />
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })} */}

                            {/* Custom image */}
                            {/* <Pressable
                                    style={[
                                        styles.templateItem,
                                        customImage && styles.templateItemSelected,
                                    ]}
                                    onPress={pickCustomImage}
                                >
                                    <View style={styles.uploadImageBox}>
                                        {customImage ? (
                                            <Image
                                                source={{ uri: customImage }}
                                                style={styles.templateImage}
                                            />
                                        ) : (
                                            <>
                                                <Ionicons
                                                    name="image-outline"
                                                    size={25}
                                                    color={theme.textMuted}
                                                />

                                                <Text style={styles.uploadText}>
                                                    Upload
                                                </Text>
                                            </>
                                        )}
                                    </View>

                                    <Text style={styles.templateName}>
                                        My photo
                                    </Text>
                                </Pressable>
                            </ScrollView> */}

                            {/* Message styles */}
                            <Text style={styles.shareSectionTitle}>
                                Message style
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.messageStyleList}
                            >
                                {MESSAGE_STYLES.map((style) => {
                                    const selected =
                                        selectedMessageStyle?.id === style.id;

                                    return (
                                        <Pressable
                                            key={style.id}
                                            onPress={() => selectMessageStyle(style)}
                                            style={[
                                                styles.messageStyleButton,
                                                selected &&
                                                styles.messageStyleButtonSelected,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.messageStyleText,
                                                    selected &&
                                                    styles.messageStyleTextSelected,
                                                ]}
                                            >
                                                {style.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                            <Text style={[styles.messageHint, { marginTop: 10, fontWeight: 600 }]}>
                                **If you want to change the message style then select above options**
                            </Text>

                            {/* Message */}
                            <View style={styles.messageHeader}>
                                <Text style={styles.shareSectionTitle}>
                                    Message
                                </Text>

                                <Text style={styles.messageHint}>
                                    You can edit this
                                </Text>
                            </View>

                            <TextInput
                                value={shareMessage}
                                onChangeText={setShareMessage}
                                multiline
                                textAlignVertical="top"
                                placeholder="Write your message..."
                                placeholderTextColor={theme.textMuted}
                                style={styles.shareMessageInput}
                            />

                            {/* Share */}
                            <Pressable
                                style={[
                                    styles.finalShareButton,
                                    sharing && { opacity: 0.6 },
                                ]}
                                onPress={doShare}
                                disabled={sharing}
                            >
                                {sharing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="share-outline"
                                            size={18}
                                            color="#fff"
                                        />

                                        <Text style={styles.finalShareButtonText}>
                                            Share Invitation
                                        </Text>
                                    </>
                                )}
                            </Pressable>

                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <ConfirmModal
                visible={modalDetails.visible}
                type="error"
                title={modalDetails.title}
                message={modalDetails.message}
                confirmLabel="ok"
                onConfirm={() => setModalDetails({ visible: false, title: "", message: "" })}
                onRequestClose={() => setModalDetails({ visible: false, title: "", message: "" })}

            />
        </>
    );
}
const styles = StyleSheet.create({
    shareModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(4,44,83,0.45)',
        justifyContent: 'flex-end',
    },

    shareModalSheet: {
        backgroundColor: theme.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        maxHeight: '94%',
    },

    shareModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },

    shareModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },

    shareSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
        marginTop: 12,
        marginBottom: 8,
    },

    sharePreview: {
        width: '100%',
        height: 230,
        borderRadius: radius.l,
        overflow: 'hidden',
        backgroundColor: theme.surfaceAlt,
    },

    sharePreviewImage: {
        width: '100%',
        height: '100%',
    },

    sharePreviewOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    sharePreviewTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },

    sharePreviewDate: {
        color: '#fff',
        fontSize: 12,
        marginTop: 3,
    },

    templateList: {
        gap: 10,
        paddingVertical: 3,
    },

    templateItem: {
        width: 105,
        position: 'relative',
    },

    templateItemSelected: {
        transform: [{ scale: 1.02 }],
    },

    templateImage: {
        width: 105,
        height: 75,
        borderRadius: 10,
    },

    templateName: {
        fontSize: 11,
        color: theme.text,
        marginTop: 5,
        textAlign: 'center',
    },

    templateCheck: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },

    uploadImageBox: {
        width: 105,
        height: 75,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surfaceAlt,
    },

    uploadText: {
        fontSize: 10,
        color: theme.textMuted,
        marginTop: 3,
    },

    messageStyleList: {
        gap: 8,
        paddingVertical: 3,
    },

    messageStyleButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
    },

    messageStyleButtonSelected: {
        backgroundColor: theme.accentTint,
        borderColor: theme.accent,
    },

    messageStyleText: {
        fontSize: 12,
        color: theme.text,
    },

    messageStyleTextSelected: {
        color: theme.accentDeep,
        fontWeight: '600',
    },

    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    messageHint: {
        fontSize: 11,
        color: theme.textMuted,
    },

    shareMessageInput: {
        minHeight: 120,
        maxHeight: 190,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
        borderRadius: radius.m,
        padding: 12,
        fontSize: 13,
        lineHeight: 19,
        color: theme.text,
        backgroundColor: theme.surfaceAlt,
    },

    finalShareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.accent,
        borderRadius: radius.m,
        paddingVertical: 13,
        marginTop: 16,
    },

    finalShareButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
})